import { memo } from "react";
import type { MemoContainerState } from "./Memo.container.hook";

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
  return (
    <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
      {isPending ? <MemoListSkeleton /> : <MemoList memos={memos} />}
    </div>
  );
}
