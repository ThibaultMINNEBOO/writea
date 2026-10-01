import { useQueryClient } from "@tanstack/react-query";
import { countWords } from "@writea/shared/text";
import { type Ref, useCallback, useDeferredValue, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  chapterKeys,
  saveChapter,
  useChapter,
  usePatchWorkChapter,
} from "@/features/workspace/queries";
import type { Chapter } from "@/lib/api";
import { ChapterStatusBar } from "./chapter-status-bar";
import { ChapterTitle } from "./chapter-title";
import { MarkdownEditor, type MarkdownEditorHandle } from "./markdown-editor";
import { useAutosave } from "./use-autosave";

type Props = {
  workId: string;
  chapterId: string;
  typewriter: boolean;
  focusMode: boolean;
  editorRef: Ref<MarkdownEditorHandle>;
  onLookupWord(word: string): void;
};

export function ChapterEditor({ chapterId, ...props }: Props) {
  const { data: chapter } = useChapter(chapterId);

  if (!chapter) {
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
  onLookupWord,
}: Omit<Props, "chapterId"> & { chapter: Chapter }) {
  const queryClient = useQueryClient();
  const patchSummary = usePatchWorkChapter(workId);
  const [content, setContent] = useState(chapter.content);
  const [initialWordCount] = useState(chapter.wordCount);
  const deferredContent = useDeferredValue(content);
  const wordCount = countWords(deferredContent);

  const save = useCallback(
    async (value: string) => {
      const saved = await saveChapter(chapter.id, { content: value });
      queryClient.setQueryData(chapterKeys.detail(chapter.id), saved);
      patchSummary(saved);
    },
    [chapter.id, queryClient, patchSummary],
  );
  const autosave = useAutosave(save);

  function handleChange(value: string) {
    setContent(value);
    autosave.schedule(value);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!focusMode && <ChapterTitle chapter={chapter} workId={workId} />}
      <div className="min-h-0 flex-1">
        <MarkdownEditor
          ref={editorRef}
          initialValue={chapter.content}
          typewriter={typewriter}
          onChange={handleChange}
          onLookupWord={onLookupWord}
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
