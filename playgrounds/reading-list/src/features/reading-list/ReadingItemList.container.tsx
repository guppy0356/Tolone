import { useSearch } from "@tanstack/react-router";
import {
  useReadingItemListFacade,
  type ReadingItemListQuery,
} from "./ReadingItemList.facade";
import { ReadingItemListComponent } from "./ReadingItemList.component";

export function ReadingItemListContainer() {
  // Read the route's validated search (the URL filter/sort/page state) and feed
  // it to the facade — the same shape as the detail container injecting an
  // itemId from useParams. Writing the URL is the Component's job (Link/navigate).
  // The router types aren't registered globally (repo convention), so the read
  // is named to the schema-inferred type whose shape validateSearch enforces.
  const query = useSearch({ from: "/reading-list" }) as ReadingItemListQuery;

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
