import { memo, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { IncidentSeverity, IncidentSort } from "@api/Incident.api";
import type { IncidentListContainerState } from "./IncidentList.container.hook";
import {
  useIncidentListComponent,
  type IncidentListComponentState,
} from "./IncidentList.component.hook";
import type { IncidentListRow } from "./IncidentList.view-model";
import type { IncidentListSearch } from "../Incident.search";

const SEVERITY_TONES: Record<IncidentSeverity, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

// The URL is the page's state, so the Component receives the parsed search
// alongside the container state and writes it back through <Link> / navigate.
export interface IncidentListComponentProps extends IncidentListContainerState {
  search: IncidentListSearch;
}

const IncidentFilters = memo(function IncidentFilters({
  search,
  statusOptions,
  severityOptions,
  assigneeOptions,
  sortOptions,
  isAssigneesPending,
  toggleStatus,
  selectSeverity,
  selectAssignee,
  selectSort,
}: Pick<
  IncidentListComponentState,
  | "statusOptions"
  | "severityOptions"
  | "assigneeOptions"
  | "sortOptions"
  | "toggleStatus"
  | "selectSeverity"
  | "selectAssignee"
  | "selectSort"
> & {
  search: IncidentListSearch;
  isAssigneesPending: boolean;
}) {
  return (
    <section className="mb-4 flex flex-wrap items-end gap-6 rounded border border-gray-200 p-4">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xs font-semibold text-gray-500">Status</legend>
        <div className="flex gap-3">
          {statusOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={option.checked}
                onChange={() => toggleStatus(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
        Severity
        <select
          className="rounded border px-2 py-1 text-sm font-normal text-black"
          value={search.severity ?? ""}
          onChange={(event) =>
            selectSeverity(event.target.value as IncidentSeverity | "")
          }
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
        Assignee
        <select
          className="rounded border px-2 py-1 text-sm font-normal text-black"
          value={search.assignee ?? ""}
          disabled={isAssigneesPending}
          onChange={(event) => selectAssignee(event.target.value)}
        >
          {assigneeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
        Sort
        <select
          className="rounded border px-2 py-1 text-sm font-normal text-black"
          value={search.sort}
          onChange={(event) => selectSort(event.target.value as IncidentSort)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
});

const IncidentTable = memo(function IncidentTable({
  rows,
  search,
}: {
  rows: IncidentListRow[];
  search: IncidentListSearch;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded border border-dashed p-8 text-center text-gray-500">
        No incidents match these filters.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id} className="rounded border p-3">
          <Link
            to="/incidents/$incidentId"
            params={{ incidentId: row.id }}
            // Carrying the filters into the detail URL is what lets the way
            // back restore them without anything remembering them.
            search={{ ...search, tab: "timeline" }}
            className="flex flex-wrap items-center gap-3"
          >
            <span className="font-mono text-xs text-gray-500">{row.key}</span>
            <span className="font-medium">{row.title}</span>
            <span
              className={`rounded px-2 py-0.5 text-xs ${SEVERITY_TONES[row.severity]}`}
            >
              {row.severityLabel}
            </span>
            <span className="text-xs text-gray-600">{row.statusLabel}</span>
            <span className="ml-auto text-xs text-gray-500">
              {row.assigneeLabel} · {row.openedAtLabel}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
});

const IncidentPager = memo(function IncidentPager({
  page,
  total,
  totalPages,
  goToPage,
}: Pick<IncidentListComponentState, "goToPage"> & {
  page: number;
  total: number;
  totalPages: number;
}) {
  return (
    <nav className="mt-4 flex items-center gap-3 text-sm">
      <button
        type="button"
        className="rounded border px-3 py-1 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => goToPage(page - 1)}
      >
        Previous
      </button>
      <span className="text-gray-600">
        Page {page} of {Math.max(totalPages, 1)} · {total} incidents
      </span>
      <button
        type="button"
        className="rounded border px-3 py-1 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1)}
      >
        Next
      </button>
    </nav>
  );
});

function IncidentTableSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2, 3, 4].map((index) => (
        <li key={index} className="rounded border p-3">
          <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export function IncidentListComponent({
  incidents,
  total,
  totalPages,
  assignees,
  isIncidentsPending,
  isIncidentsRefetching,
  isAssigneesPending,
  search,
}: IncidentListComponentProps) {
  const navigate = useNavigate();

  const applySearch = useCallback(
    (next: IncidentListSearch) => {
      void navigate({ to: "/incidents", search: next });
    },
    [navigate],
  );

  const {
    rows,
    statusOptions,
    severityOptions,
    assigneeOptions,
    sortOptions,
    toggleStatus,
    selectSeverity,
    selectAssignee,
    selectSort,
    goToPage,
  } = useIncidentListComponent({ incidents, assignees, search, applySearch });

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Incidents</h1>

      {/* The filters stay rendered while the list loads — they are the
          controls that started the load. */}
      <IncidentFilters
        search={search}
        statusOptions={statusOptions}
        severityOptions={severityOptions}
        assigneeOptions={assigneeOptions}
        sortOptions={sortOptions}
        isAssigneesPending={isAssigneesPending}
        toggleStatus={toggleStatus}
        selectSeverity={selectSeverity}
        selectAssignee={selectAssignee}
        selectSort={selectSort}
      />

      {isIncidentsPending ? (
        <IncidentTableSkeleton />
      ) : (
        <div
          className={`transition-opacity ${isIncidentsRefetching ? "opacity-50" : ""}`}
        >
          <IncidentTable rows={rows} search={search} />
          <IncidentPager
            page={search.page}
            total={total}
            totalPages={totalPages}
            goToPage={goToPage}
          />
        </div>
      )}
    </div>
  );
}
