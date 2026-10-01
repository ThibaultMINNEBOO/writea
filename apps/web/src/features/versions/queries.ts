import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workKeys } from "@/features/library/queries";
import { chapterKeys } from "@/features/workspace/queries";
import { api, unwrap } from "@/lib/api";

export const versionKeys = {
  list: (chapterId: string) => ["chapters", chapterId, "versions"] as const,
};

export const useVersions = (chapterId: string) =>
  useQuery({
    queryKey: versionKeys.list(chapterId),
    queryFn: () => unwrap(api.chapters[":id"].versions.$get({ param: { id: chapterId } })),
  });

export function useCreateVersion(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) =>
      unwrap(api.chapters[":id"].versions.$post({ param: { id: chapterId }, json: { label } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: versionKeys.list(chapterId) }),
  });
}

export function useRestoreVersion(chapterId: string, workId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.versions[":id"].restore.$post({ param: { id } })),
    onSuccess: (chapter) => {
      queryClient.setQueryData(chapterKeys.detail(chapterId), chapter);
      void queryClient.invalidateQueries({ queryKey: versionKeys.list(chapterId) });
      void queryClient.invalidateQueries({ queryKey: workKeys.detail(workId) });
    },
  });
}

export function useDeleteVersion(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.versions[":id"].$delete({ param: { id } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: versionKeys.list(chapterId) }),
  });
}
