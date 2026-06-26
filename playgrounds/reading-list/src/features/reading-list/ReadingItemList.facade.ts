import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readingItemQueries } from "./ReadingItem.queries";
import {
  readingItemApi,
  PER_PAGE,
  type ReadingItemSummary,
  type CreateReadingItemInput,
} from "./ReadingItem.api";
import type { ReadingItemListQuery } from "./ReadingItem.schema";

// The query shape is defined by the route's validateSearch schema; re-exported
// so the presenter keeps importing it from the facade (its published contract).
export type { ReadingItemListQuery };

export interface ReadingItemListFacadeProps {
  query: ReadingItemListQuery;
}

export interface ReadingItemListFacade {
  items: ReadingItemSummary[];
  total: number;
  perPage: number;
  isPending: boolean;
  isRefetching: boolean;
  addItem: (input: CreateReadingItemInput) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

// URL-agnostic: the container reads the route's validated search and injects it
// as `query` (the same way the detail container injects an itemId from
// useParams). The facade only turns that query into a cache key and exposes the
// resulting server state + mutations — it knows nothing about the router/URL.
export function useReadingItemListFacade({
  query,
}: ReadingItemListFacadeProps): ReadingItemListFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isRefetching } = useQuery(
    readingItemQueries.list(query),
  );

  // Reconcile every list variant after a write. Both mutations invalidate
  // rather than update optimistically: create has no server-assigned
  // id/title/thumbnail/createdAt to fabricate, and delete cannot recompute the
  // server's pagination (total + page contents) — so neither can honestly
  // patch the cache. The lists() prefix catches all filter/page combinations.
  const invalidateLists = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: readingItemQueries.lists() }),
    [queryClient],
  );

  const addMutation = useMutation({
    mutationFn: (input: CreateReadingItemInput) => readingItemApi.create(input),
    onSettled: invalidateLists,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => readingItemApi.delete(id),
    onSettled: (_data, _error, id) => {
      // Drop the deleted item's detail cache instead of invalidating it —
      // invalidation would refetch a now-missing resource and 404.
      queryClient.removeQueries({
        queryKey: readingItemQueries.detail(id).queryKey,
      });
      invalidateLists();
    },
  });

  const addItem = useCallback(
    async (input: CreateReadingItemInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation.mutateAsync],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation.mutateAsync],
  );

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    perPage: data?.perPage ?? PER_PAGE,
    isPending,
    isRefetching,
    addItem,
    deleteItem,
  };
}
