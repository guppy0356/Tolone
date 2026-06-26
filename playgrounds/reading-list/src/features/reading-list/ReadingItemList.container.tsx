import { useCallback } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  useReadingItemListFacade,
  type ReadingItemListQuery,
} from "./ReadingItemList.facade";
import { ReadingItemListComponent } from "./ReadingItemList.component";

const LIST_ROUTE = "/reading-list";

export function ReadingItemListContainer() {
  // The container is the routing layer: it reads the route's validated search
  // (which drives the facade's list query) and writes it back by navigating.
  // The facade stays URL-agnostic — it just receives `query`, mirroring how the
  // detail container hands the detail facade an itemId from useParams. The
  // router types aren't registered globally (repo convention), so the read is
  // named to the schema-inferred type whose shape validateSearch enforces.
  const query = useSearch({ from: LIST_ROUTE }) as ReadingItemListQuery;
  const navigate = useNavigate();

  const setQuery = useCallback(
    (next: ReadingItemListQuery) => {
      navigate({ to: LIST_ROUTE, search: next });
    },
    [navigate],
  );

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
      setQuery={setQuery}
      addItem={addItem}
      deleteItem={deleteItem}
    />
  );
}
