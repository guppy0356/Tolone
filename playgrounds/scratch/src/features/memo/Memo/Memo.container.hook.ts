import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api-client";
import type { Memo } from "../../../lib/api.gen";

export interface MemoContainerState {
  memos: Memo[];
  isPending: boolean;
  isRefetching: boolean;
  deleteMemo: (id: string) => Promise<void>;
}

export function useMemoContainer(): MemoContainerState {
  const queryClient = useQueryClient();

  const { data, isPending, isRefetching } = useQuery({
    queryKey: ["memos"],
    queryFn: () => api.get("/api/memos"),
  });

  // 削除したら一覧を取り直す。そのために同じ key をもう 1 回書いている。
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete("/api/memos/{id}", { path: { id } }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["memos"] });
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
