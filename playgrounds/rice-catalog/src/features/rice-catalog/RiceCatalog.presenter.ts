import { useState, useMemo, useEffect } from "react";
import type { Rice } from "./RiceCatalog.api";

export interface RiceCatalogPresenterProps {
  rices: Rice[];
}

export interface RiceCatalogPresenter {
  searchText: string;
  setSearchText: (value: string) => void;
  brandFilter: string;
  setBrandFilter: (value: string) => void;
  producerFilter: string;
  setProducerFilter: (value: string) => void;
  regionFilter: string;
  setRegionFilter: (value: string) => void;
  filteredRices: Rice[];
  brandOptions: string[];
  producerOptions: string[];
  regionOptions: string[];
}

export function useRiceCatalogPresenter({
  rices,
}: RiceCatalogPresenterProps): RiceCatalogPresenter {
  const [searchText, setSearchText] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [producerFilter, setProducerFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  // Step 1: Free-text search filters the full list
  const textFilteredRices = useMemo(() => {
    const query = searchText.toLowerCase().trim();
    if (!query) return rices;
    return rices.filter(
      (r) =>
        r.brand.toLowerCase().includes(query) ||
        r.producer.toLowerCase().includes(query) ||
        r.region.toLowerCase().includes(query),
    );
  }, [rices, searchText]);

  // Step 2: Derive select-box options from text-filtered results
  const brandOptions = useMemo(
    () => [...new Set(textFilteredRices.map((r) => r.brand))].sort(),
    [textFilteredRices],
  );
  const producerOptions = useMemo(
    () => [...new Set(textFilteredRices.map((r) => r.producer))].sort(),
    [textFilteredRices],
  );
  const regionOptions = useMemo(
    () => [...new Set(textFilteredRices.map((r) => r.region))].sort(),
    [textFilteredRices],
  );

  // Step 3: Auto-reset select-box values when they fall out of available options
  useEffect(() => {
    if (brandFilter && !brandOptions.includes(brandFilter)) setBrandFilter("");
  }, [brandFilter, brandOptions]);
  useEffect(() => {
    if (producerFilter && !producerOptions.includes(producerFilter))
      setProducerFilter("");
  }, [producerFilter, producerOptions]);
  useEffect(() => {
    if (regionFilter && !regionOptions.includes(regionFilter))
      setRegionFilter("");
  }, [regionFilter, regionOptions]);

  // Step 4: Apply select-box filters to text-filtered results
  const filteredRices = useMemo(() => {
    return textFilteredRices.filter(
      (r) =>
        (!brandFilter || r.brand === brandFilter) &&
        (!producerFilter || r.producer === producerFilter) &&
        (!regionFilter || r.region === regionFilter),
    );
  }, [textFilteredRices, brandFilter, producerFilter, regionFilter]);

  return {
    searchText,
    setSearchText,
    brandFilter,
    setBrandFilter,
    producerFilter,
    setProducerFilter,
    regionFilter,
    setRegionFilter,
    filteredRices,
    brandOptions,
    producerOptions,
    regionOptions,
  };
}
