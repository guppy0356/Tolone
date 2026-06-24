import { useReadingItemListFacade } from "./ReadingItemList.facade";
import { ReadingItemListComponent } from "./ReadingItemList.component";

export function ReadingItemListContainer() {
  const {
    items,
    total,
    perPage,
    query,
    isPending,
    isRefetching,
    setQuery,
    addItem,
    deleteItem,
  } = useReadingItemListFacade();

  return (
    <ReadingItemListComponent
      items={items}
      total={total}
      perPage={perPage}
      query={query}
      isPending={isPending}
      isRefetching={isRefetching}
      setQuery={setQuery}
      addItem={addItem}
      deleteItem={deleteItem}
    />
  );
}
