import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommentCreate } from "@writea/shared/schemas";
import { versionKeys } from "@/features/versions/queries";
import { api, unwrap } from "@/lib/api";

const reviewKeys = {
  shared: (token: string) => ["review", token] as const,
  chapterComments: (chapterId: string) => ["chapters", chapterId, "comments"] as const,
};

export const useSharedVersion = (token: string) =>
  useQuery({
    queryKey: reviewKeys.shared(token),
    queryFn: () => unwrap(api.review[":token"].$get({ param: { token } })),
    retry: false,
  });

export function useAddReviewComment(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (json: CommentCreate) =>
      unwrap(api.review[":token"].comments.$post({ param: { token }, json })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewKeys.shared(token) }),
  });
}

export const useChapterComments = (chapterId: string) =>
  useQuery({
    queryKey: reviewKeys.chapterComments(chapterId),
    queryFn: () => unwrap(api.chapters[":id"].comments.$get({ param: { id: chapterId } })),
    enabled: chapterId !== "",
    refetchOnWindowFocus: true,
  });

export function useResolveComment(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) =>
      unwrap(api.comments[":id"].$patch({ param: { id }, json: { resolved } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewKeys.chapterComments(chapterId) });
      void queryClient.invalidateQueries({ queryKey: versionKeys.list(chapterId) });
    },
  });
}

export function useShareVersion(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.versions[":id"].share.$post({ param: { id } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: versionKeys.list(chapterId) }),
  });
}

export function useRevokeShare(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.versions[":id"].share.$delete({ param: { id } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: versionKeys.list(chapterId) }),
  });
}

export const reviewUrl = (token: string) => `${window.location.origin}/relecture/${token}`;
