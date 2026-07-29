import { useCallback, useMemo } from "react";
import type {
  IncidentSeverity,
  IncidentSort,
  IncidentStatus,
  IncidentSummary,
} from "@api/Incident.api";
import type { User } from "@api/User.api";
import { INCIDENT_STATUSES } from "@api/Incident.api";
import type { IncidentListSearch } from "../Incident.search";
import {
  ANY_ASSIGNEE,
  SEVERITY_OPTIONS,
  SORT_OPTIONS,
  toAssigneeOptions,
  toIncidentListRow,
  toStatusOptions,
  type IncidentListRow,
  type SelectOption,
  type StatusOption,
} from "./IncidentList.view-model";

export interface IncidentListComponentParams {
  incidents: IncidentSummary[];
  assignees: User[];
  search: IncidentListSearch;
  /** Writes the next search to the URL — supplied by the Component. */
  applySearch: (next: IncidentListSearch) => void;
}

export interface IncidentListComponentState {
  rows: IncidentListRow[];
  statusOptions: StatusOption[];
  severityOptions: SelectOption<IncidentSeverity | "">[];
  assigneeOptions: SelectOption<string>[];
  sortOptions: SelectOption<IncidentSort>[];
  toggleStatus: (status: IncidentStatus) => void;
  selectSeverity: (severity: IncidentSeverity | "") => void;
  selectAssignee: (assignee: string) => void;
  selectSort: (sort: IncidentSort) => void;
  goToPage: (page: number) => void;
}

export function useIncidentListComponent({
  incidents,
  assignees,
  search,
  applySearch,
}: IncidentListComponentParams): IncidentListComponentState {
  const rows = useMemo(() => incidents.map(toIncidentListRow), [incidents]);

  const statusOptions = useMemo(
    () => toStatusOptions(search.status),
    [search.status],
  );

  const assigneeOptions = useMemo(
    () => toAssigneeOptions(assignees),
    [assignees],
  );

  // Narrowing the result set invalidates the current page number: page 4 of the
  // old filter is rarely page 4 of the new one, and is often past the end.
  const applyFilter = useCallback(
    (patch: Partial<IncidentListSearch>) => {
      applySearch({ ...search, ...patch, page: 1 });
    },
    [search, applySearch],
  );

  const toggleStatus = useCallback(
    (status: IncidentStatus) => {
      const selected = search.status.includes(status)
        ? search.status.filter((value) => value !== status)
        : [...search.status, status];
      // Kept in contract order so that two ways of arriving at the same filter
      // produce the same URL — and therefore the same query key.
      applyFilter({
        status: INCIDENT_STATUSES.filter((value) => selected.includes(value)),
      });
    },
    [search.status, applyFilter],
  );

  const selectSeverity = useCallback(
    (severity: IncidentSeverity | "") =>
      applyFilter({ severity: severity === "" ? undefined : severity }),
    [applyFilter],
  );

  const selectAssignee = useCallback(
    (assignee: string) =>
      applyFilter({ assignee: assignee === ANY_ASSIGNEE ? undefined : assignee }),
    [applyFilter],
  );

  const selectSort = useCallback(
    (sort: IncidentSort) => applyFilter({ sort }),
    [applyFilter],
  );

  // Paging is not a filter change: it is the one control that must not reset.
  const goToPage = useCallback(
    (page: number) => applySearch({ ...search, page }),
    [search, applySearch],
  );

  return {
    rows,
    statusOptions,
    severityOptions: SEVERITY_OPTIONS,
    assigneeOptions,
    sortOptions: SORT_OPTIONS,
    toggleStatus,
    selectSeverity,
    selectAssignee,
    selectSort,
    goToPage,
  };
}
