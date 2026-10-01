import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChapterUpdate } from "@writea/shared/schemas";
import { workKeys } from "@/features/library/queries";
import { api, type ChapterSummary, unwrap, type WorkDetail } from "@/lib/api";

export const chapterKeys = {
  detail: (id: string) => ["chapters", id] as const,
};

export const useWork = (id: string) =>
  useQuery({
    queryKey: workKeys.detail(id),
    queryFn: () => unwrap(api.works[":id"].$get({ param: { id } })),
  });

export const useChapter = (id: string) =>
  useQuery({
    queryKey: chapterKeys.detail(id),
    queryFn: () => unwrap(api.chapters[":id"].$get({ param: { id } })),
    staleTime: Number.POSITIVE_INFINITY,
  });

export const saveChapter = (id: string, json: ChapterUpdate) =>
  unwrap(api.chapters[":id"].$patch({ param: { id }, json }, { init: { keepalive: true } }));

export function usePatchWorkChapter(workId: string) {
  const queryClient = useQueryClient();
  return (chapter: Partial<ChapterSummary> & { id: string }) =>
    queryClient.setQueryData<WorkDetail>(workKeys.detail(workId), (work) =>
      work
        ? {
            ...work,
            chapters: work.chapters.map((c) => (c.id === chapter.id ? { ...c, ...chapter } : c)),
          }
        : work,
    );
}

export function useUpdateChapter(workId: string) {
  const queryClient = useQueryClient();
  const patchSummary = usePatchWorkChapter(workId);
  return useMutation({
    mutationFn: ({ id, ...json }: ChapterUpdate & { id: string }) => saveChapter(id, json),
    onSuccess: (chapter) => {
      queryClient.setQueryData(chapterKeys.detail(chapter.id), chapter);
      patchSummary(chapter);
    },
  });
}

export function useCreateChapter(workId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.works[":id"].chapters.$post({ param: { id: workId }, json: {} })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workKeys.detail(workId) }),
  });
}

export function useDeleteChapter(workId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.chapters[":id"].$delete({ param: { id } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workKeys.detail(workId) }),
  });
}

export function useReorderChapters(workId: string) {
  const queryClient = useQueryClient();
  const key = workKeys.detail(workId);
  return useMutation({
    mutationFn: (chapterIds: string[]) =>
      unwrap(api.works[":id"].chapters.order.$put({ param: { id: workId }, json: { chapterIds } })),
    onMutate: async (chapterIds) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WorkDetail>(key);
      if (previous) {
        const byId = new Map(previous.chapters.map((c) => [c.id, c]));
        const chapters = chapterIds.flatMap((id, position) => {
          const chapter = byId.get(id);
          return chapter ? [{ ...chapter, position }] : [];
        });
        queryClient.setQueryData<WorkDetail>(key, { ...previous, chapters });
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });
}
