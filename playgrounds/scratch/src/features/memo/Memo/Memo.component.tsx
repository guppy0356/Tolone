import { memo } from "react";
import { useMemoComponent, type MemoFilter } from "./Memo.component.hook";
import type { MemoContainerState } from "./Memo.container.hook";

const FILTERS: MemoFilter[] = ["all", "draft", "published"];

// Private memo'd body — the items, and nothing that survives loading
const MemoList = memo(function MemoList({ memos }: { memos: MemoContainerState["memos"] }) {
  return (
    <ul className="space-y-2">
      {memos.map((m) => (
        <li key={m.id} className="rounded border p-2">
          {m.title}
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
  const { filter, setFilter, visibleMemos } = useMemoComponent({ memos });

  return (
    <>
      <div role="tablist" className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1 ${filter === f ? "bg-blue-500 text-white" : "bg-gray-100"}`}
          >
            {f === "all" ? "すべて" : f === "draft" ? "下書き" : "公開済み"}
          </button>
        ))}
      </div>
      <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
        {isPending ? <MemoListSkeleton /> : <MemoList memos={visibleMemos} />}
      </div>
    </>
  );
}
