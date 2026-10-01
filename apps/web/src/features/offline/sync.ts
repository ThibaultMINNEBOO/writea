import type { QueryClient } from "@tanstack/react-query";
import { contentFingerprint } from "@writea/shared/text";
import { toast } from "sonner";
import { workKeys } from "@/features/library/queries";
import { chapterKeys, patchWorkChapter, saveChapter } from "@/features/workspace/queries";
import { ApiError } from "@/lib/api";
import { type Draft, isDraftClaimed, listDrafts, settleDraft } from "./drafts";

type Push = Pick<Draft, "chapterId" | "workId" | "content" | "baseFingerprint">;

/** Sends a chapter's text to the server and reconciles the local caches and draft. */
export async function pushChapterContent(queryClient: QueryClient, push: Push) {
  const saved = await saveChapter(push.chapterId, {
    content: push.content,
    baseFingerprint: push.baseFingerprint,
  });
  const fingerprint = contentFingerprint(push.content);
  settleDraft(push.chapterId, push.content, fingerprint);
  queryClient.setQueryData(chapterKeys.detail(push.chapterId), saved);
  patchWorkChapter(queryClient, push.workId, saved);
  if (saved.conflictSaved) {
    toast.info(`« ${saved.title} » avait été modifié ailleurs`, {
      description:
        "Votre texte hors ligne a été appliqué ; l'ancien est conservé dans les versions.",
      duration: 10_000,
    });
  }
  return fingerprint;
}

let syncing = false;

/** Pushes drafts left by closed editors, e.g. text written offline before closing the app. */
export async function syncDrafts(queryClient: QueryClient) {
  if (syncing) return;
  syncing = true;
  let synced = 0;
  try {
    for (const draft of listDrafts()) {
      if (isDraftClaimed(draft.chapterId)) continue;
      try {
        await pushChapterContent(queryClient, draft);
        synced++;
      } catch (error) {
        if (!(error instanceof ApiError)) break;
      }
    }
  } finally {
    syncing = false;
  }
  if (synced > 0) {
    void queryClient.invalidateQueries({ queryKey: workKeys.all });
    toast.success(
      synced > 1
        ? `${synced} chapitres écrits hors ligne ont été synchronisés`
        : "Un chapitre écrit hors ligne a été synchronisé",
    );
  }
}
