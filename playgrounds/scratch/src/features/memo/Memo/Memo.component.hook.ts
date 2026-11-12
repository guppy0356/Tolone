import { useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
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

// タブをリロード後も残したいので、useState をやめて URL を読み書きする。
// ルートは ?status を宣言していないので search は {} 型。読むにはキャストが要る。
export function useMemoComponent({ memos }: MemoComponentParams): MemoComponentState {
  const search = useSearch({ strict: false }) as { status?: string };
  const navigate = useNavigate();

  // ?status=foo のような値は手で弾く。弾き忘れたら filter が壊れる。
  const filter: MemoFilter =
    search.status === "draft" || search.status === "published" ? search.status : "all";

  const setFilter = useCallback(
    (next: MemoFilter) => {
      navigate({ to: "/", search: { status: next } as never });
    },
    [navigate],
  );

  const rows = useMemo(
    () =>
      (filter === "all" ? memos : memos.filter((m) => m.status === filter)).map(toMemoListRow),
    [memos, filter],
  );

  return { filter, setFilter, rows };
}
