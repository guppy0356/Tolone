import { useSearch } from "@tanstack/react-router";
import { useMemoContainer } from "./Memo.container.hook";
import { MemoComponent } from "./Memo.component";

export function MemoContainer() {
  // The Container reads the URL; the Component writes it. The hook never sees it.
  const search = useSearch({ from: "/" });
  const { memos, isPending, isRefetching, deleteMemo } = useMemoContainer();
  return (
    <MemoComponent
      memos={memos}
      isPending={isPending}
      isRefetching={isRefetching}
      deleteMemo={deleteMemo}
      search={search}
    />
  );
}
