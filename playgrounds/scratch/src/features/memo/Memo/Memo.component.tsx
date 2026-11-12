import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { MemoStatus } from "@api/Memo.api";
import { useMemoComponent } from "./Memo.component.hook";
import type { MemoContainerState } from "./Memo.container.hook";
import type { MemoSearch } from "./Memo.search";
import { MEMO_FILTER_OPTIONS, type MemoListRow } from "./Memo.view-model";

// The one addition the props take from outside the hook: the URL state the
// Component renders and writes back.
export interface MemoComponentProps extends MemoContainerState {
  search: MemoSearch;
}

// Styling is the Component's, keyed from the raw member the view model keeps
// beside its label.
const STATUS_TONE: Record<MemoStatus, string> = {
  draft: "text-gray-500",
  published: "text-green-700",
};

// Private memo'd body — the rows, and nothing that survives loading
const MemoList = memo(function MemoList({
  rows,
  onDelete,
}: {
  rows: MemoListRow[];
  onDelete: MemoContainerState["deleteMemo"];
}) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between rounded border p-2">
          <span>{row.title}</span>
          <span className="flex items-center gap-3">
            <span className={`text-sm ${STATUS_TONE[row.status]}`}>
              {row.statusLabel} · {row.createdOn}
            </span>
            <button
              type="button"
              onClick={() => onDelete(row.id)}
              aria-label={`${row.title} を削除`}
              className="rounded px-2 py-0.5 text-sm text-red-600 hover:bg-red-50"
            >
              削除
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
});

// Private Skeleton — li-granular, standing in for the same <ul>
function MemoListSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li key={i} className="rounded border p-2">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

// Exported Component. The tabs are links: the Component writes the URL, and
// a tab is a pane, not a destination, so it navigates with replace. Which tab
// is current comes from the search prop, so a story can pin it through args.
export function MemoComponent({
  memos,
  isPending,
  isRefetching,
  deleteMemo,
  search,
}: MemoComponentProps) {
  const { rows } = useMemoComponent({ memos, status: search.status });

  return (
    <>
      <div role="tablist" className="mb-4 flex gap-2">
        {MEMO_FILTER_OPTIONS.map(({ value, label }) => (
          <Link
            key={value}
            to="/"
            search={{ status: value }}
            replace
            role="tab"
            aria-selected={search.status === value}
            className={`rounded px-3 py-1 ${search.status === value ? "bg-blue-500 text-white" : "bg-gray-100"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
        {isPending ? <MemoListSkeleton /> : <MemoList rows={rows} onDelete={deleteMemo} />}
      </div>
    </>
  );
}
