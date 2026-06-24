import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readingItemQueries } from "./ReadingItem.queries";
import {
  readingItemApi,
  type ReadingItemSummary,
  type ReadingStatus,
  type ReadingOrder,
  type CreateReadingItemInput,
} from "./ReadingItem.api";

const PER_PAGE = 5;

// Facade-scoped query inputs the list UI mutates. perPage is fixed and lives
// outside this state; page is part of it because pagination drives the query.
export interface ReadingItemListQuery {
  status?: ReadingStatus;
  createdFrom?: string;
  createdTo?: string;
  order: ReadingOrder;
  page: number;
}

const DEFAULT_QUERY: ReadingItemListQuery = { order: "desc", page: 1 };

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

  const [query, setQuery] = useState<ReadingItemListQuery>(DEFAULT_QUERY);

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
