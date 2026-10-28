import { useMemo, useState } from "react";
import type { MemoContainerState } from "./Memo.container.hook";

export type MemoFilter = "all" | "draft" | "published";

export interface MemoComponentParams {
  memos: MemoContainerState["memos"];
}

export interface MemoComponentState {
  filter: MemoFilter;
  setFilter: (filter: MemoFilter) => void;
  visibleMemos: MemoContainerState["memos"];
}

export function useMemoComponent({ memos }: MemoComponentParams): MemoComponentState {
  const [filter, setFilter] = useState<MemoFilter>("all");

  const visibleMemos = useMemo(
    () => (filter === "all" ? memos : memos.filter((m) => m.status === filter)),
    [memos, filter],
  );

  return { filter, setFilter, visibleMemos };
}
