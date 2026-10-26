import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api-client";
import type { Memo } from "../../../lib/api.gen";

export interface MemoContainerState {
  memos: Memo[];
  isPending: boolean;
  isRefetching: boolean;
}

export function useMemoContainer(): MemoContainerState {
  // queryKey と queryFn はまだここに直書き。4 段目で Memo.queries.ts に移る。
  const { data, isPending, isRefetching } = useQuery({
    queryKey: ["memos"],
    queryFn: () => api.get("/api/memos"),
  });

  return { memos: data ?? [], isPending, isRefetching };
}
