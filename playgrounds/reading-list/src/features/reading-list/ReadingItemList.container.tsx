import { useSearch } from "@tanstack/react-router";
import { useReadingItemListFacade } from "./ReadingItemList.facade";
import { ReadingItemListComponent } from "./ReadingItemList.component";

export function ReadingItemListContainer() {
  // Read the route's validated search (the URL filter/sort/page state) and feed
  // it to the facade — the same shape as the detail container injecting an
  // itemId from useParams. Writing the URL is the Component's job (Link/navigate).
  // Typed via the registered router (validateSearch), so no cast is needed.
  const query = useSearch({ from: "/reading-list" });

  const { items, total, perPage, isPending, isRefetching, addItem, deleteItem } =
    useReadingItemListFacade({ query });

  return (
    <ReadingItemListComponent
      items={items}
      total={total}
      perPage={perPage}
      query={query}
      isPending={isPending}
      isRefetching={isRefetching}
      addItem={addItem}
      deleteItem={deleteItem}
    />
  );
}
