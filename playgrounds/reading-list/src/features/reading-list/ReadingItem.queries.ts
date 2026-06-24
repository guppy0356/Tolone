import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { readingItemApi, type ReadingItemListParams } from "./ReadingItem.api";

export const readingItemQueries = {
  all: () => ["reading-items"] as const,
  // Prefix shared by every paginated/filtered list variant. Invalidating this
  // refetches all of them regardless of the params baked into each key.
  lists: () => [...readingItemQueries.all(), "list"] as const,
  list: (params: ReadingItemListParams) =>
    queryOptions({
      queryKey: [...readingItemQueries.lists(), params],
      queryFn: () => readingItemApi.getList(params),
      // Keep the current page on screen while the next page/filter loads, so
      // the Component shows an opacity overlay instead of a skeleton.
      placeholderData: keepPreviousData,
    }),
  details: () => [...readingItemQueries.all(), "detail"] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...readingItemQueries.details(), id],
      queryFn: () => readingItemApi.getDetail(id),
      // A 404 is a real answer ("no such item"), not a transient failure.
      retry: false,
    }),
};
