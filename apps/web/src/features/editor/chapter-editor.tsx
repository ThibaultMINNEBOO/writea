import { useQueryClient } from "@tanstack/react-query";
import { contentFingerprint, countWords } from "@writea/shared/text";
import {
  type Ref,
  useCallback,
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { claimDraft, isDraftClaimed, readDraft, writeDraft } from "@/features/offline/drafts";
import { OfflineUnavailable } from "@/features/offline/offline-unavailable";
import { pushChapterContent, reconcileDraft } from "@/features/offline/sync";
import {
  chapterKeys,
  fetchChapter,
  useChapter,
  usePatchWorkChapter,
} from "@/features/workspace/queries";
import { ApiError, type Chapter } from "@/lib/api";
import { connectivity } from "@/lib/connectivity";
import { ChapterStatusBar } from "./chapter-status-bar";
import { ChapterTitle } from "./chapter-title";
import { MarkdownEditor, type MarkdownEditorHandle, type QuotedComment } from "./markdown-editor";
import { type SaveOutcome, useAutosave } from "./use-autosave";

const REMOTE_CHECK_INTERVAL = 30_000;

export type ChapterEditorHandle = MarkdownEditorHandle & { flush(): Promise<void> };

type Props = {
  workId: string;
  chapterId: string;
  typewriter: boolean;
  focusMode: boolean;
  editorRef: Ref<ChapterEditorHandle>;
  comments: QuotedComment[];
  onLookupWord(word: string): void;
  onCommentSelect(id: string): void;
};

/**
 * Waits for the server's copy of the chapter when it is reachable, so an outdated copy kept on
 * this device is never edited (and saved over newer work). Without network, the copy is used.
 */
function useChapterForEditing(chapterId: string) {
  const queryClient = useQueryClient();
  const query = useChapter(chapterId);
  const { data: chapter, fetchStatus, isFetchedAfterMount, isRefetchError } = query;
  const fresh = Boolean(chapter) && isFetchedAfterMount && !isRefetchError;
  const usable = fresh || fetchStatus === "paused" || isRefetchError;
  const [reconciled, setReconciled] = useState(false);

  useEffect(() => {
    if (!fresh || !chapter || reconciled) return;
    const draft = readDraft(chapter.id);
    if (!draft || isDraftClaimed(chapter.id)) {
      setReconciled(true);
      return;
    }
    reconcileDraft(queryClient, draft, chapter)
      .catch(() => {})
      .finally(() => setReconciled(true));
  }, [fresh, chapter, reconciled, queryClient]);

  const ready = usable && (!fresh || reconciled);
  return { ...query, ready };
}

export function ChapterEditor({ chapterId, ...props }: Props) {
  const { data: chapter, fetchStatus, ready } = useChapterForEditing(chapterId);

  if (!chapter && fetchStatus === "paused") {
    return (
      <div className="mx-auto w-full max-w-[68ch] px-6 py-12">
        <OfflineUnavailable title="Chapitre indisponible hors ligne" />
      </div>
    );
  }

  if (!chapter || !ready) {
    return (
      <div className="mx-auto flex w-full max-w-[68ch] flex-col gap-4 px-6 py-12">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    );
  }

  return <LoadedChapterEditor key={chapter.id} chapter={chapter} {...props} />;
}

function LoadedChapterEditor({
  chapter,
  workId,
  typewriter,
  focusMode,
  editorRef,
  comments,
  onLookupWord,
  onCommentSelect,
}: Omit<Props, "chapterId"> & { chapter: Chapter }) {
  const queryClient = useQueryClient();
  const patchSummary = usePatchWorkChapter(workId);
  const [restoredDraft] = useState(() => {
    const draft = readDraft(chapter.id);
    return draft && draft.content !== chapter.content ? draft : null;
  });
  const [initialContent] = useState(restoredDraft?.content ?? chapter.content);
  const [content, setContent] = useState(initialContent);
  const [initialWordCount] = useState(chapter.wordCount);
  const baseFingerprint = useRef(
    restoredDraft?.baseFingerprint ?? contentFingerprint(chapter.content),
  );
  const deferredContent = useDeferredValue(content);
  const wordCount = countWords(deferredContent);

  const save = useCallback(
    async (value: string): Promise<SaveOutcome> => {
      const keepLocally = () => {
        patchSummary({ id: chapter.id, wordCount: countWords(value) });
        return "local" as const;
      };
      if (!connectivity.isOnline()) return keepLocally();
      try {
        baseFingerprint.current = await pushChapterContent(queryClient, {
          chapterId: chapter.id,
          workId,
          content: value,
          baseFingerprint: baseFingerprint.current,
        });
        return "saved";
      } catch (error) {
        if (error instanceof ApiError) throw error;
        return keepLocally();
      }
    },
    [chapter.id, workId, queryClient, patchSummary],
  );
  const autosave = useAutosave(save);
  const markdownRef = useRef<MarkdownEditorHandle>(null);

  useEffect(() => claimDraft(chapter.id), [chapter.id]);

  const status = useRef(autosave.status);
  useEffect(() => {
    status.current = autosave.status;
  });

  useEffect(() => {
    async function pullRemoteChanges() {
      const idle = () => status.current === "saved";
      if (document.visibilityState !== "visible" || !connectivity.isOnline() || !idle()) return;
      try {
        const server = await fetchChapter(chapter.id);
        const fingerprint = contentFingerprint(server.content);
        if (fingerprint === baseFingerprint.current || !idle()) return;
        baseFingerprint.current = fingerprint;
        markdownRef.current?.replaceContent(server.content);
        setContent(server.content);
        queryClient.setQueryData(chapterKeys.detail(chapter.id), server);
        patchSummary(server);
        toast.info("Chapitre mis à jour", {
          description: "Les modifications faites sur un autre appareil ont été chargées.",
        });
      } catch {}
    }

    const interval = setInterval(pullRemoteChanges, REMOTE_CHECK_INTERVAL);
    window.addEventListener("focus", pullRemoteChanges);
    document.addEventListener("visibilitychange", pullRemoteChanges);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", pullRemoteChanges);
      document.removeEventListener("visibilitychange", pullRemoteChanges);
    };
  }, [chapter.id, queryClient, patchSummary]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: replays the restored draft once
  useEffect(() => {
    if (!restoredDraft) return;
    toast.info("Modifications hors ligne restaurées", {
      description: "Le texte écrit sur cet appareil sera synchronisé dès que possible.",
    });
    autosave.schedule(restoredDraft.content);
  }, []);

  useImperativeHandle(editorRef, () => ({
    wordAtCursor: () => markdownRef.current?.wordAtCursor() ?? null,
    replaceWordAtCursor: (text) => markdownRef.current?.replaceWordAtCursor(text),
    revealComment: (id) => markdownRef.current?.revealComment(id) ?? false,
    replaceContent: (text) => markdownRef.current?.replaceContent(text),
    focus: () => markdownRef.current?.focus(),
    flush: autosave.flush,
  }));

  function handleChange(value: string) {
    setContent(value);
    writeDraft({
      chapterId: chapter.id,
      workId,
      content: value,
      baseFingerprint: baseFingerprint.current,
      savedAt: Date.now(),
    });
    autosave.schedule(value);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!focusMode && <ChapterTitle key={chapter.title} chapter={chapter} workId={workId} />}
      <div className="min-h-0 flex-1">
        <MarkdownEditor
          ref={markdownRef}
          initialValue={initialContent}
          typewriter={typewriter}
          onChange={handleChange}
          onLookupWord={onLookupWord}
          comments={comments}
          onCommentSelect={onCommentSelect}
        />
      </div>
      <ChapterStatusBar
        chapter={chapter}
        workId={workId}
        wordCount={wordCount}
        sessionWords={wordCount - initialWordCount}
        status={autosave.status}
        onRetry={autosave.flush}
        subdued={focusMode}
      />
    </div>
  );
}
