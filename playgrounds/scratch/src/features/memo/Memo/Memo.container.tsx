import { useMemoContainer } from "./Memo.container.hook";
import { MemoComponent } from "./Memo.component";

export function MemoContainer() {
  const { memos, isPending, isRefetching, deleteMemo } = useMemoContainer();
  return (
    <MemoComponent
      memos={memos}
      isPending={isPending}
      isRefetching={isRefetching}
      deleteMemo={deleteMemo}
    />
  );
}
