import { memo } from "react";
import { useMemoComponent } from "./Memo.component.hook";
import type { MemoContainerState } from "./Memo.container.hook";
import { MEMO_FILTER_OPTIONS, type MemoListRow, type MemoStatus } from "./Memo.view-model";

// Styling is the Component's, keyed from the raw member the view model keeps
// beside its label.
const STATUS_TONE: Record<MemoStatus, string> = {
  draft: "text-gray-500",
  published: "text-green-700",
};

// Private memo'd body — the rows, and nothing that survives loading
const MemoList = memo(function MemoList({ rows }: { rows: MemoListRow[] }) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="flex justify-between rounded border p-2">
          <span>{row.title}</span>
          <span className={`text-sm ${STATUS_TONE[row.status]}`}>
            {row.statusLabel} · {row.createdOn}
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

// Exported Component — renders the whole container state, so its props are the interface.
// The component hook is called here, not in the body: the tab is local state and must
// survive the Skeleton toggle, and the tabs themselves stay rendered while items load.
export function MemoComponent({ memos, isPending, isRefetching }: MemoContainerState) {
  const { filter, setFilter, rows } = useMemoComponent({ memos });

  return (
    <>
      <div role="tablist" className="mb-4 flex gap-2">
        {MEMO_FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={`rounded px-3 py-1 ${filter === value ? "bg-blue-500 text-white" : "bg-gray-100"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
        {isPending ? <MemoListSkeleton /> : <MemoList rows={rows} />}
      </div>
    </>
  );
}
