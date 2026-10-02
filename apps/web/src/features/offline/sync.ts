import type { QueryClient } from "@tanstack/react-query";
import { contentFingerprint } from "@writea/shared/text";
import { toast } from "sonner";
import { workKeys } from "@/features/library/queries";
import { versionKeys } from "@/features/versions/queries";
import { chapterKeys, patchWorkChapter, saveChapter } from "@/features/workspace/queries";
import { ApiError, api, type Chapter, unwrap } from "@/lib/api";
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

export type ReconcileResult = "unchanged" | "pushed" | "preserved";

const UNSYNCED_DRAFT_LABEL = "Brouillon non synchronisé de cet appareil";

const reconciling = new Map<string, Promise<ReconcileResult>>();

/**
 * Decides what to do with a local draft once the server's current chapter is known. A draft that
 * continues the server text is sent; one written on top of an older text never overwrites newer
 * work: the server text stays and the draft is kept as a version.
 */
export function reconcileDraft(
  queryClient: QueryClient,
  draft: Draft,
  server: Pick<Chapter, "id" | "title" | "content">,
): Promise<ReconcileResult> {
  const running = reconciling.get(draft.chapterId);
  if (running) return running;
  const reconciliation = applyReconciliation(queryClient, draft, server).finally(() =>
    reconciling.delete(draft.chapterId),
  );
  reconciling.set(draft.chapterId, reconciliation);
  return reconciliation;
}

async function applyReconciliation(
  queryClient: QueryClient,
  draft: Draft,
  server: Pick<Chapter, "id" | "title" | "content">,
): Promise<ReconcileResult> {
  const serverFingerprint = contentFingerprint(server.content);
  if (draft.content === server.content) {
    settleDraft(draft.chapterId, draft.content, serverFingerprint);
    return "unchanged";
  }
  if (draft.baseFingerprint === serverFingerprint) {
    await pushChapterContent(queryClient, draft);
    return "pushed";
  }
  await unwrap(
    api.chapters[":id"].versions.$post({
      param: { id: draft.chapterId },
      json: { label: UNSYNCED_DRAFT_LABEL, content: draft.content },
    }),
  );
  settleDraft(draft.chapterId, draft.content, serverFingerprint);
  void queryClient.invalidateQueries({ queryKey: versionKeys.list(draft.chapterId) });
  toast.info(`« ${server.title} » a été modifié sur un autre appareil`, {
    description: `Le texte le plus récent est affiché ; celui de cet appareil est conservé dans les versions (« ${UNSYNCED_DRAFT_LABEL} »).`,
    duration: 12_000,
  });
  return "preserved";
}

let syncing = false;

/** Reconciles drafts left by closed editors, e.g. text written offline before closing the app. */
export async function syncDrafts(queryClient: QueryClient) {
  if (syncing) return;
  syncing = true;
  let pushed = 0;
  try {
    for (const draft of listDrafts()) {
      if (isDraftClaimed(draft.chapterId)) continue;
      try {
        const server = await unwrap(api.chapters[":id"].$get({ param: { id: draft.chapterId } }));
        if ((await reconcileDraft(queryClient, draft, server)) === "pushed") pushed++;
      } catch (error) {
        if (!(error instanceof ApiError)) break;
      }
    }
  } finally {
    syncing = false;
  }
  if (pushed > 0) {
    void queryClient.invalidateQueries({ queryKey: workKeys.all });
    toast.success(
      pushed > 1
        ? `${pushed} chapitres écrits hors ligne ont été synchronisés`
        : "Un chapitre écrit hors ligne a été synchronisé",
    );
  }
}
