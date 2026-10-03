import { memo, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ApplicationStatus } from "@api/Application.api";
import { useApplicationListComponent } from "./ApplicationList.component.hook";
import type { ApplicationListContainerState } from "./ApplicationList.container.hook";
import type { ApplicationListSearch } from "./ApplicationList.search";
import { SORT_OPTIONS, STATUS_OPTIONS, type ApplicationListRow } from "./ApplicationList.view-model";

export interface ApplicationListComponentProps extends ApplicationListContainerState {
  search: ApplicationListSearch;
}

// Styling is the Component's: keyed from the raw status beside the JSX.
const STATUS_TONE: Record<ApplicationStatus, string> = {
  applied: "bg-gray-100 text-gray-700",
  screening: "bg-blue-100 text-blue-700",
  interviewing: "bg-amber-100 text-amber-800",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

interface ApplicationRowsProps {
  rows: ApplicationListRow[];
  updateStatus: ApplicationListContainerState["updateStatus"];
  deleteApplication: ApplicationListContainerState["deleteApplication"];
}

// Private memo'd body — the rows, and nothing that survives loading.
const ApplicationRows = memo(function ApplicationRows({
  rows,
  updateStatus,
  deleteApplication,
}: ApplicationRowsProps) {
  if (rows.length === 0) {
    return <p className="rounded border border-dashed p-6 text-center text-gray-500">No applications match.</p>;
  }
  return (
    <ul className="divide-y rounded border">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-4 p-3">
          <div className="min-w-0 flex-1">
            {/* A row is the address of an application, not a description of the list around it. */}
            <Link
              to="/applications/$applicationId"
              params={{ applicationId: row.id }}
              className="block truncate font-medium hover:underline"
            >
              {row.position}
            </Link>
            <p className="truncate text-sm text-gray-600">
              {row.companyName} · applied {row.appliedAt}
            </p>
          </div>
          <span className={`rounded px-2 py-0.5 text-xs ${STATUS_TONE[row.status]}`}>
            {row.statusLabel}
          </span>
          <select
            aria-label={`Status of ${row.position}`}
            value={row.status}
            onChange={(e) => updateStatus(row.id, e.target.value as ApplicationStatus)}
            className="rounded border px-2 py-1 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => deleteApplication(row.id)}
            aria-label={`Delete ${row.position}`}
            className="text-sm text-red-600 hover:underline"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
});

// Private Skeleton — li-granular, standing in for the same <ul>.
function ApplicationRowsSkeleton() {
  return (
    <ul className="divide-y rounded border" aria-label="Loading applications">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-4 p-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export function ApplicationListComponent({
  applications,
  total,
  pageSize,
  isPending,
  isRefetching,
  updateStatus,
  deleteApplication,
  search,
}: ApplicationListComponentProps) {
  const navigate = useNavigate();
  const applySearch = useCallback(
    (next: ApplicationListSearch) => navigate({ to: "/applications", search: next }),
    [navigate],
  );
  const { rows, pageCount, toggleStatus, setSort, previousPageSearch, nextPageSearch } =
    useApplicationListComponent({ applications, total, pageSize, search, applySearch });

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Link to="/applications/new" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">
          New application
        </Link>
      </header>

      {/* Filters stay rendered while the rows load, so the frame does not flash. */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <fieldset className="flex flex-wrap gap-3">
          <legend className="sr-only">Status</legend>
          {STATUS_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={search.status.includes(o.value)}
                onChange={() => toggleStatus(o.value)}
              />
              {o.label}
            </label>
          ))}
        </fieldset>
        <label htmlFor="application-sort" className="ml-auto">
          Sort
        </label>
        <select
            id="application-sort"
            value={search.sort}
            onChange={(e) => setSort(e.target.value as ApplicationListSearch["sort"])}
            className="rounded border px-2 py-1"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
        </select>
      </div>

      <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
        {isPending ? (
          <ApplicationRowsSkeleton />
        ) : (
          <ApplicationRows rows={rows} updateStatus={updateStatus} deleteApplication={deleteApplication} />
        )}
      </div>

      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
        {previousPageSearch ? (
          <Link to="/applications" search={previousPageSearch} className="text-blue-600 hover:underline">
            Previous
          </Link>
        ) : (
          <span className="text-gray-400">Previous</span>
        )}
        <span>
          Page {search.page} of {pageCount}
        </span>
        {nextPageSearch ? (
          <Link to="/applications" search={nextPageSearch} className="text-blue-600 hover:underline">
            Next
          </Link>
        ) : (
          <span className="text-gray-400">Next</span>
        )}
      </nav>
    </>
  );
}
