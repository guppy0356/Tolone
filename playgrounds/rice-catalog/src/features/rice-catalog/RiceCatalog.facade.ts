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
  searchText: string;
  setSearchText: (value: string) => void;
  brandFilter: string;
  setBrandFilter: (value: string) => void;
  producerFilter: string;
  setProducerFilter: (value: string) => void;
  regionFilter: string;
  setRegionFilter: (value: string) => void;
}

const riceKeys = {
  list: (params: RiceSearchParams) => ["rices", "list", params] as const,
  filters: (params: RiceSearchParams) => ["rices", "filters", params] as const,
};

const emptyFilters: RiceFilters = { brands: [], producers: [], regions: [] };

export function useRiceCatalogFacade(): RiceCatalogFacade {
  const [searchText, setSearchText] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [producerFilter, setProducerFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const params: RiceSearchParams = {
    search: searchText,
    brand: brandFilter,
    producer: producerFilter,
    region: regionFilter,
  };

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

  const resolvedFilters = filtersData ?? emptyFilters;

  // Derive effective filter values — if the selected value is not in the
  // options returned by the server, treat it as unselected (empty string).
  // No useEffect needed; the derived value drives both the query params
  // on the next render and the UI display.
  const effectiveBrand = resolvedFilters.brands.includes(brandFilter)
    ? brandFilter
    : "";
  const effectiveProducer = resolvedFilters.producers.includes(producerFilter)
    ? producerFilter
    : "";
  const effectiveRegion = resolvedFilters.regions.includes(regionFilter)
    ? regionFilter
    : "";

  const handleSetBrandFilter = useCallback((value: string) => {
    setBrandFilter(value);
  }, []);

  const handleSetProducerFilter = useCallback((value: string) => {
    setProducerFilter(value);
  }, []);

  const handleSetRegionFilter = useCallback((value: string) => {
    setRegionFilter(value);
  }, []);

  return {
    rices: rices ?? [],
    filters: resolvedFilters,
    isPending: ricesPending || filtersPending,
    isFetching: ricesFetching || filtersFetching,
    searchText,
    setSearchText,
    brandFilter: effectiveBrand,
    setBrandFilter: handleSetBrandFilter,
    producerFilter: effectiveProducer,
    setProducerFilter: handleSetProducerFilter,
    regionFilter: effectiveRegion,
    setRegionFilter: handleSetRegionFilter,
  };
}
