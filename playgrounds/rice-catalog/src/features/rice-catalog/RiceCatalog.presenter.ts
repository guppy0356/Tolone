import type { RiceFilters } from "./RiceCatalog.api";

export interface RiceCatalogPresenterProps {
  filters: RiceFilters;
  brandFilter: string;
  producerFilter: string;
  regionFilter: string;
}

export interface RiceCatalogPresenter {
  brandOptions: string[];
  producerOptions: string[];
  regionOptions: string[];
}

function mergeOptions(options: string[], selected: string): string[] {
  if (!selected || options.includes(selected)) return options;
  return [selected, ...options];
}

export function useRiceCatalogPresenter({
  filters,
  brandFilter,
  producerFilter,
  regionFilter,
}: RiceCatalogPresenterProps): RiceCatalogPresenter {
  return {
    brandOptions: mergeOptions(filters.brands, brandFilter),
    producerOptions: mergeOptions(filters.producers, producerFilter),
    regionOptions: mergeOptions(filters.regions, regionFilter),
  };
}
