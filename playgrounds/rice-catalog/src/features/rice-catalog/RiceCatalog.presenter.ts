import { useCallback } from "react";
import type { RiceFilters, RiceSearchParams } from "./RiceCatalog.api";

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
  handleSearchChange: (value: string) => void;
  handleBrandChange: (value: string) => void;
  handleProducerChange: (value: string) => void;
  handleRegionChange: (value: string) => void;
}

function mergeOptions(options: string[], selected: string): string[] {
  if (!selected || options.includes(selected)) return options;
  return [selected, ...options];
}

export function useRiceCatalogPresenter({
  filters,
  params,
  setSearchQuery,
}: RiceCatalogPresenterProps): RiceCatalogPresenter {
  const searchText = params.search ?? "";
  const brandFilter = params.brand ?? "";
  const producerFilter = params.producer ?? "";
  const regionFilter = params.region ?? "";

  const handleSearchChange = useCallback(
    (value: string) => setSearchQuery({ ...params, search: value }),
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
    handleSearchChange,
    handleBrandChange,
    handleProducerChange,
    handleRegionChange,
  };
}
