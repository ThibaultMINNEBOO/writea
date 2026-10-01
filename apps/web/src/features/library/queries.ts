import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkInput } from "@writea/shared/schemas";
import { api, unwrap } from "@/lib/api";

export const workKeys = {
  all: ["works"] as const,
  detail: (id: string) => ["works", id] as const,
};

export const useWorks = () =>
  useQuery({ queryKey: workKeys.all, queryFn: () => unwrap(api.works.$get()) });

export function useCreateWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (json: WorkInput) => unwrap(api.works.$post({ json })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workKeys.all }),
  });
}

export function useDeleteWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap(api.works[":id"].$delete({ param: { id } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workKeys.all }),
  });
}
