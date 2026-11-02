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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memoApi.delete(id),
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
