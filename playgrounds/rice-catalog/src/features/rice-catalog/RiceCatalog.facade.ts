import { useState } from "react";
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

  return {
    rices: rices ?? [],
    filters: filtersData ?? emptyFilters,
    isPending: ricesPending || filtersPending,
    isFetching: ricesFetching || filtersFetching,
    searchText,
    setSearchText,
    brandFilter,
    setBrandFilter,
    producerFilter,
    setProducerFilter,
    regionFilter,
    setRegionFilter,
  };
}
