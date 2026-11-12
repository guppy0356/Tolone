import { useMemo } from "react";
import type { MemoContainerState } from "./Memo.container.hook";
import type { MemoStatusFilter } from "./Memo.search";
import { toMemoListRow, type MemoListRow } from "./Memo.view-model";

export interface MemoComponentParams {
  memos: MemoContainerState["memos"];
  status: MemoStatusFilter;
}

export interface MemoComponentState {
  rows: MemoListRow[];
}

// No state left here: the selected status arrives from the URL as a param.
// Purely derivation, and the memoizing is what the hook is for.
export function useMemoComponent({ memos, status }: MemoComponentParams): MemoComponentState {
  const rows = useMemo(
    () =>
      (status === "all" ? memos : memos.filter((m) => m.status === status)).map(toMemoListRow),
    [memos, status],
  );

  return { rows };
}
