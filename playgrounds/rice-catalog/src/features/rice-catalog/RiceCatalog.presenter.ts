import { useState, useCallback } from "react";
import type { RiceFilters, RiceSearchParams } from "./RiceCatalog.api";

export interface RiceCatalogPresenterProps {
  filters: RiceFilters;
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
  setSearchQuery,
}: RiceCatalogPresenterProps): RiceCatalogPresenter {
  const [searchText, setSearchText] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [producerFilter, setProducerFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const buildParams = useCallback(
    (overrides: Partial<RiceSearchParams>): RiceSearchParams => ({
      search: searchText,
      brand: brandFilter,
      producer: producerFilter,
      region: regionFilter,
      ...overrides,
    }),
    [searchText, brandFilter, producerFilter, regionFilter],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchText(value);
      setSearchQuery(buildParams({ search: value }));
    },
    [setSearchQuery, buildParams],
  );

  const handleBrandChange = useCallback(
    (value: string) => {
      setBrandFilter(value);
      setSearchQuery(buildParams({ brand: value }));
    },
    [setSearchQuery, buildParams],
  );

  const handleProducerChange = useCallback(
    (value: string) => {
      setProducerFilter(value);
      setSearchQuery(buildParams({ producer: value }));
    },
    [setSearchQuery, buildParams],
  );

  const handleRegionChange = useCallback(
    (value: string) => {
      setRegionFilter(value);
      setSearchQuery(buildParams({ region: value }));
    },
    [setSearchQuery, buildParams],
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
