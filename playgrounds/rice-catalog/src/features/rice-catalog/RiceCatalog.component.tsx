import { memo } from "react";
import { useRiceCatalogPresenter } from "./RiceCatalog.presenter";
import type { RiceCatalogFacade } from "./RiceCatalog.facade";
import type { Rice, RiceFilters } from "./RiceCatalog.api";

// --- View (memo) ---

interface RiceCatalogViewProps {
  rices: Rice[];
  filters: RiceFilters;
  params: RiceCatalogFacade["params"];
  setSearchQuery: RiceCatalogFacade["setSearchQuery"];
}

const RiceCatalogView = memo(function RiceCatalogView({
  rices,
  filters,
  params,
  setSearchQuery,
}: RiceCatalogViewProps) {
  const {
    searchText,
    brandFilter,
    producerFilter,
    regionFilter,
    brandOptions,
    producerOptions,
    regionOptions,
    handleSearchChange,
    handleBrandChange,
    handleProducerChange,
    handleRegionChange,
  } = useRiceCatalogPresenter({ filters, params, setSearchQuery });

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Rice Catalog</h1>

      <input
        type="text"
        value={searchText}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search by brand, producer, or region..."
        className="mb-4 w-full rounded border px-3 py-2"
      />

      <div className="mb-4 flex gap-4">
        <select
          aria-label="Brand filter"
          value={brandFilter}
          onChange={(e) => handleBrandChange(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">All brands</option>
          {brandOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          aria-label="Producer filter"
          value={producerFilter}
          onChange={(e) => handleProducerChange(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">All producers</option>
          {producerOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          aria-label="Region filter"
          value={regionFilter}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">All regions</option>
          {regionOptions.map((r) => (
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
  params,
  setSearchQuery,
}: RiceCatalogFacade) {
  if (isPending) {
    return <RiceCatalogSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <RiceCatalogView
        rices={rices}
        filters={filters}
        params={params}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
}
