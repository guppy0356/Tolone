import { useMemo, useState } from "react";
import type { MemoContainerState } from "./Memo.container.hook";
import { toMemoListRow, type MemoFilter, type MemoListRow } from "./Memo.view-model";

export interface MemoComponentParams {
  memos: MemoContainerState["memos"];
}

export interface MemoComponentState {
  filter: MemoFilter;
  setFilter: (filter: MemoFilter) => void;
  rows: MemoListRow[];
}

export function useMemoComponent({ memos }: MemoComponentParams): MemoComponentState {
  const [filter, setFilter] = useState<MemoFilter>("all");

  // The building lives in the view model; only the memoizing lives here.
  const rows = useMemo(
    () =>
      (filter === "all" ? memos : memos.filter((m) => m.status === filter)).map(toMemoListRow),
    [memos, filter],
  );

  return { filter, setFilter, rows };
}
