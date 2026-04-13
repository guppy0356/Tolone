import { useState, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  riceCatalogApi,
  type Rice,
  type RiceFilters,
  type RiceSearchParams,
} from "./RiceCatalog.api";

export interface RiceCatalogFacade {
  rices: Rice[];
  filters: RiceFilters;
  isPending: boolean;
  isFetching: boolean;
  setSearchQuery: (params: RiceSearchParams) => void;
}

const riceKeys = {
  list: (params: RiceSearchParams) => ["rices", "list", params] as const,
  filters: (params: RiceSearchParams) => ["rices", "filters", params] as const,
};

const emptyFilters: RiceFilters = { brands: [], producers: [], regions: [] };

export function useRiceCatalogFacade(): RiceCatalogFacade {
  const [params, setParams] = useState<RiceSearchParams>({});

  const setSearchQuery = useCallback(
    (newParams: RiceSearchParams) => setParams(newParams),
    [],
  );

  const {
    data: rices,
    isPending: ricesPending,
    isFetching: ricesFetching,
  } = useQuery({
    queryKey: riceKeys.list(params),
    queryFn: () => riceCatalogApi.getAll(params),
    placeholderData: keepPreviousData,
  });

  const {
    data: filtersData,
    isPending: filtersPending,
    isFetching: filtersFetching,
  } = useQuery({
    queryKey: riceKeys.filters(params),
    queryFn: () => riceCatalogApi.getFilters(params),
    placeholderData: keepPreviousData,
  });

  return {
    rices: rices ?? [],
    filters: filtersData ?? emptyFilters,
    isPending: ricesPending || filtersPending,
    isFetching: ricesFetching || filtersFetching,
    setSearchQuery,
  };
}
