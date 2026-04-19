import { useState, useCallback, useRef } from "react";
import type { RiceFilters, RiceSearchParams } from "./RiceCatalog.api";

const SEARCH_DEBOUNCE_MS = 300;

export interface RiceCatalogPresenterProps {
  filters: RiceFilters;
  params: RiceSearchParams;
  setSearchQuery: (params: RiceSearchParams) => void;
}

export interface RiceCatalogPresenter {
  searchText: string;
  brandFilter: string;
  producerFilter: string;
  regionFilter: string;
  brandOptions: string[];
  producerOptions: string[];
  regionOptions: string[];
  brandLabel: string;
  producerLabel: string;
  regionLabel: string;
  handleSearchChange: (value: string) => void;
  handleBrandChange: (value: string) => void;
  handleProducerChange: (value: string) => void;
  handleRegionChange: (value: string) => void;
}

function mergeOptions(options: string[], selected: string): string[] {
  if (!selected || options.includes(selected)) return options;
  return [selected, ...options];
}

function filterLabel(name: string, count: number, total: number): string {
  return count < total ? `${name} (${count})` : name;
}

export function useRiceCatalogPresenter({
  filters,
  params,
  setSearchQuery,
}: RiceCatalogPresenterProps): RiceCatalogPresenter {
  const [inputText, setInputText] = useState(params.search ?? "");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchText = inputText;
  const brandFilter = params.brand ?? "";
  const producerFilter = params.producer ?? "";
  const regionFilter = params.region ?? "";

  const handleSearchChange = useCallback(
    (value: string) => {
      setInputText(value);
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setSearchQuery({ ...params, search: value });
      }, SEARCH_DEBOUNCE_MS);
    },
    [setSearchQuery, params],
  );

  const handleBrandChange = useCallback(
    (value: string) => setSearchQuery({ ...params, brand: value }),
    [setSearchQuery, params],
  );

  const handleProducerChange = useCallback(
    (value: string) => setSearchQuery({ ...params, producer: value }),
    [setSearchQuery, params],
  );

  const handleRegionChange = useCallback(
    (value: string) => setSearchQuery({ ...params, region: value }),
    [setSearchQuery, params],
  );

  return {
    searchText,
    brandFilter,
    producerFilter,
    regionFilter,
    brandOptions: mergeOptions(filters.brands, brandFilter),
    producerOptions: mergeOptions(filters.producers, producerFilter),
    regionOptions: mergeOptions(filters.regions, regionFilter),
    brandLabel: filterLabel("Brand", filters.brands.length, filters.totalBrands),
    producerLabel: filterLabel("Producer", filters.producers.length, filters.totalProducers),
    regionLabel: filterLabel("Region", filters.regions.length, filters.totalRegions),
    handleSearchChange,
    handleBrandChange,
    handleProducerChange,
    handleRegionChange,
  };
}
