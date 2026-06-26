import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { readingItemQueries } from "./ReadingItem.queries";
import {
  readingItemApi,
  type ReadingItemSummary,
  type CreateReadingItemInput,
} from "./ReadingItem.api";
import type { ReadingItemListQuery } from "./ReadingItem.schema";

// The query shape is defined by the route's validateSearch schema; re-exported
// so the presenter keeps importing it from the facade (its published contract).
export type { ReadingItemListQuery };

const PER_PAGE = 5;
const LIST_ROUTE = "/reading-list";

export interface ReadingItemListFacade {
  items: ReadingItemSummary[];
  total: number;
  perPage: number;
  query: ReadingItemListQuery;
  isPending: boolean;
  isRefetching: boolean;
  setQuery: (query: ReadingItemListQuery) => void;
  addItem: (input: CreateReadingItemInput) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export function useReadingItemListFacade(): ReadingItemListFacade {
  const queryClient = useQueryClient();

  // The filter/sort/page state lives in the URL: read it via the route's
  // validated search, write it by navigating with new search params. This is
  // facade-scoped state (per the architecture doc) backed by the URL instead of
  // useState, so the interface (query + setQuery) is unchanged for callers.
  // The route types are not registered globally (repo convention), so the read
  // is named to the schema-inferred type, whose shape validateSearch enforces.
  const query = useSearch({ from: LIST_ROUTE }) as ReadingItemListQuery;
  const navigate = useNavigate();

  const setQuery = useCallback(
    (next: ReadingItemListQuery) => {
      navigate({ to: LIST_ROUTE, search: next });
    },
    [navigate],
  );

  const { data, isPending, isRefetching } = useQuery(
    readingItemQueries.list({ ...query, perPage: PER_PAGE }),
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
    query,
    isPending,
    isRefetching,
    setQuery,
    addItem,
    deleteItem,
  };
}
