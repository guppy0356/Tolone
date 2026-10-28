import { memo, useState } from "react";
import type { MemoContainerState } from "./Memo.container.hook";

type MemoFilter = "all" | "draft" | "published";
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

// Exported Component — renders the whole container state, so its props are the interface
export function MemoComponent({ memos, isPending, isRefetching }: MemoContainerState) {
  // タブを足した。選択中タブの state と絞り込みがここに居座り始める。
  const [filter, setFilter] = useState<MemoFilter>("all");
  const visibleMemos = filter === "all" ? memos : memos.filter((m) => m.status === filter);

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
