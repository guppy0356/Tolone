import { memo } from "react";
import type { RiceCatalogFacade } from "./RiceCatalog.facade";
import type { Rice, RiceFilters } from "./RiceCatalog.api";

// --- View (memo) ---

interface RiceCatalogViewProps {
  rices: Rice[];
  filters: RiceFilters;
  searchText: string;
  setSearchText: (value: string) => void;
  brandFilter: string;
  setBrandFilter: (value: string) => void;
  producerFilter: string;
  setProducerFilter: (value: string) => void;
  regionFilter: string;
  setRegionFilter: (value: string) => void;
}

const RiceCatalogView = memo(function RiceCatalogView({
  rices,
  filters,
  searchText,
  setSearchText,
  brandFilter,
  setBrandFilter,
  producerFilter,
  setProducerFilter,
  regionFilter,
  setRegionFilter,
}: RiceCatalogViewProps) {
  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Rice Catalog</h1>

      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search by brand, producer, or region..."
        className="mb-4 w-full rounded border px-3 py-2"
      />

      <div className="mb-4 flex gap-4">
        <select
          aria-label="Brand filter"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">All brands</option>
          {brandFilter && !filters.brands.includes(brandFilter) && (
            <option key={brandFilter} value={brandFilter}>
              {brandFilter}
            </option>
          )}
          {filters.brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          aria-label="Producer filter"
          value={producerFilter}
          onChange={(e) => setProducerFilter(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">All producers</option>
          {producerFilter && !filters.producers.includes(producerFilter) && (
            <option key={producerFilter} value={producerFilter}>
              {producerFilter}
            </option>
          )}
          {filters.producers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          aria-label="Region filter"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">All regions</option>
          {regionFilter && !filters.regions.includes(regionFilter) && (
            <option key={regionFilter} value={regionFilter}>
              {regionFilter}
            </option>
          )}
          {filters.regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left">Brand</th>
            <th className="px-4 py-2 text-left">Producer</th>
            <th className="px-4 py-2 text-left">Region</th>
          </tr>
        </thead>
        <tbody>
          {rices.map((rice) => (
            <tr key={rice.id} className="border-b">
              <td className="px-4 py-2">{rice.brand}</td>
              <td className="px-4 py-2">{rice.producer}</td>
              <td className="px-4 py-2">{rice.region}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// --- Skeleton ---

function RiceCatalogSkeleton() {
  return (
    <div className="mx-auto max-w-4xl p-4" aria-label="Loading rice catalog">
      <div className="mb-4 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mb-4 h-10 w-full animate-pulse rounded bg-gray-200" />
      <div className="mb-4 flex gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="h-10 w-40 animate-pulse rounded bg-gray-200"
          />
        ))}
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="mb-2 h-8 w-full animate-pulse rounded bg-gray-200"
        />
      ))}
    </div>
  );
}

// --- Component (outer, no memo) ---

export function RiceCatalogComponent({
  rices,
  filters,
  isPending,
  isFetching,
  searchText,
  setSearchText,
  brandFilter,
  setBrandFilter,
  producerFilter,
  setProducerFilter,
  regionFilter,
  setRegionFilter,
}: RiceCatalogFacade) {
  if (isPending) {
    return <RiceCatalogSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <RiceCatalogView
        rices={rices}
        filters={filters}
        searchText={searchText}
        setSearchText={setSearchText}
        brandFilter={brandFilter}
        setBrandFilter={setBrandFilter}
        producerFilter={producerFilter}
        setProducerFilter={setProducerFilter}
        regionFilter={regionFilter}
        setRegionFilter={setRegionFilter}
      />
    </div>
  );
}
