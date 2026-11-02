import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memoQueries } from "@api/Memo.queries";
import { memoApi, type Memo } from "@api/Memo.api";

export interface MemoContainerState {
  memos: Memo[];
  isPending: boolean;
  isRefetching: boolean;
  deleteMemo: (id: string) => Promise<void>;
}

export function useMemoContainer(): MemoContainerState {
  const queryClient = useQueryClient();

  const listQuery = memoQueries.list();
  const { data, isPending, isRefetching } = useQuery(listQuery);

  // Optimistic update: the list stays on screen after a delete, so the user
  // observes the mutated cache. Remove the row at once, roll back on error,
  // and reconcile with the server afterwards.
  const deleteMutation = useMutation({
    mutationFn: (id: string) => memoApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData(listQuery.queryKey);
      queryClient.setQueryData(listQuery.queryKey, (old) => old?.filter((m) => m.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQuery.queryKey });
    },
  });

  const deleteMemo = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation.mutateAsync],
  );

  return { memos: data ?? [], isPending, isRefetching, deleteMemo };
}
