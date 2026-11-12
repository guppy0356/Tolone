import type { Memo, MemoStatus } from "@api/Memo.api";
import type { MemoStatusFilter } from "./Memo.search";

export interface MemoListRow {
  id: string;
  title: string;
  // The raw member rides beside its label: the Component keys its styling
  // from it, beside the JSX. A className never comes from this file.
  status: MemoStatus;
  statusLabel: string;
  createdOn: string;
}

// This page's wording. Exhaustive over MemoStatus, so a status added to the
// contract breaks the build here until it has been given a name.
const STATUS_LABELS: Record<MemoStatus, string> = {
  draft: "下書き",
  published: "公開済み",
};

// Depends on neither server data nor current state — a constant, not a memo.
// "すべて" first, then the statuses in this table's order.
export const MEMO_FILTER_OPTIONS: { value: MemoStatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  ...(Object.entries(STATUS_LABELS) as [MemoStatus, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

export function toMemoListRow(memo: Memo): MemoListRow {
  return {
    id: memo.id,
    title: memo.title,
    status: memo.status,
    statusLabel: STATUS_LABELS[memo.status],
    // No Intl: the instant's UTC calendar date as YYYY/MM/DD, so a test sees
    // the same string on every machine.
    createdOn: memo.createdAt.slice(0, 10).replaceAll("-", "/"),
  };
}
