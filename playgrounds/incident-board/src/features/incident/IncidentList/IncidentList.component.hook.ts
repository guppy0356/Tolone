import { useCallback, useMemo } from "react";
import type {
  IncidentSeverity,
  IncidentSort,
  IncidentStatus,
  IncidentSummary,
} from "@api/Incident.api";
import type { User } from "@api/User.api";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SORTS,
  INCIDENT_STATUSES,
  type IncidentListSearch,
} from "../Incident.search";
import { formatInstant } from "../helpers/instant";
import { SEVERITY_LABELS, STATUS_LABELS } from "../helpers/labels";

const SORT_LABELS: Record<IncidentSort, string> = {
  "-openedAt": "Newest first",
  openedAt: "Oldest first",
  "-severity": "Most severe first",
  severity: "Least severe first",
};

export const ANY_ASSIGNEE = "";

export interface IncidentRow {
  id: string;
  key: string;
  title: string;
  status: IncidentStatus;
  statusLabel: string;
  severity: IncidentSeverity;
  severityLabel: string;
  assigneeLabel: string;
  openedAtLabel: string;
}

export interface StatusOption {
  value: IncidentStatus;
  label: string;
  checked: boolean;
}

export interface SelectOption<Value extends string> {
  value: Value;
  label: string;
}

export interface IncidentListComponentParams {
  incidents: IncidentSummary[];
  assignees: User[];
  search: IncidentListSearch;
  /** Writes the next search to the URL — supplied by the Component. */
  applySearch: (next: IncidentListSearch) => void;
}

export interface IncidentListComponentState {
  rows: IncidentRow[];
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
  const rows = useMemo<IncidentRow[]>(
    () =>
      incidents.map((incident) => ({
        id: incident.id,
        key: incident.key,
        title: incident.title,
        status: incident.status,
        statusLabel: STATUS_LABELS[incident.status],
        severity: incident.severity,
        severityLabel: SEVERITY_LABELS[incident.severity],
        assigneeLabel: incident.assignee?.name ?? "Unassigned",
        openedAtLabel: formatInstant(incident.openedAt),
      })),
    [incidents],
  );

  const statusOptions = useMemo<StatusOption[]>(
    () =>
      INCIDENT_STATUSES.map((value) => ({
        value,
        label: STATUS_LABELS[value],
        checked: search.status.includes(value),
      })),
    [search.status],
  );

  const severityOptions = useMemo<SelectOption<IncidentSeverity | "">[]>(
    () => [
      { value: "", label: "Any severity" },
      ...INCIDENT_SEVERITIES.map((value) => ({
        value,
        label: SEVERITY_LABELS[value],
      })),
    ],
    [],
  );

  // Server-returned options merged with the "no filter" choice.
  const assigneeOptions = useMemo<SelectOption<string>[]>(
    () => [
      { value: ANY_ASSIGNEE, label: "Anyone" },
      ...assignees.map((user) => ({ value: user.id, label: user.name })),
    ],
    [assignees],
  );

  const sortOptions = useMemo<SelectOption<IncidentSort>[]>(
    () => INCIDENT_SORTS.map((value) => ({ value, label: SORT_LABELS[value] })),
    [],
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
    severityOptions,
    assigneeOptions,
    sortOptions,
    toggleStatus,
    selectSeverity,
    selectAssignee,
    selectSort,
    goToPage,
  };
}
