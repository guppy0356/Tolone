import type {
  IncidentSeverity,
  IncidentSort,
  IncidentStatus,
  IncidentSummary,
} from "@api/Incident.api";
import type { User } from "@api/User.api";
import { formatInstant } from "../helpers/instant";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SORTS,
  INCIDENT_STATUSES,
} from "../Incident.search";

// Each page spells the contract's vocabulary for itself. Both `Record`s are
// exhaustive over the contract type, so a status added to the API breaks the
// build here — the one place that notices, since the `as const` vocabulary
// arrays accept a narrower list without complaint.
const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};


const SORT_LABELS: Record<IncidentSort, string> = {
  "-openedAt": "Newest first",
  openedAt: "Oldest first",
  "-severity": "Most severe first",
  severity: "Least severe first",
};

/** The `<select>` value that stands for "no assignee filter". */
export const ANY_ASSIGNEE = "";

export interface IncidentListRow {
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

export function toIncidentListRow(incident: IncidentSummary): IncidentListRow {
  return {
    id: incident.id,
    key: incident.key,
    title: incident.title,
    status: incident.status,
    statusLabel: STATUS_LABELS[incident.status],
    severity: incident.severity,
    severityLabel: SEVERITY_LABELS[incident.severity],
    assigneeLabel: incident.assignee?.name ?? "Unassigned",
    openedAtLabel: formatInstant(incident.openedAt),
  };
}

export function toStatusOptions(selected: IncidentStatus[]): StatusOption[] {
  return INCIDENT_STATUSES.map((value) => ({
    value,
    label: STATUS_LABELS[value],
    checked: selected.includes(value),
  }));
}

/** Server-returned people, fronted by the "no filter" choice. */
export function toAssigneeOptions(assignees: User[]): SelectOption<string>[] {
  return [
    { value: ANY_ASSIGNEE, label: "Anyone" },
    ...assignees.map((user) => ({ value: user.id, label: user.name })),
  ];
}

// Neither list depends on server data or on the current search, so both are
// built once here rather than memoized per render in the hook.
export const SEVERITY_OPTIONS: SelectOption<IncidentSeverity | "">[] = [
  { value: "", label: "Any severity" },
  ...INCIDENT_SEVERITIES.map((value) => ({
    value,
    label: SEVERITY_LABELS[value],
  })),
];

export const SORT_OPTIONS: SelectOption<IncidentSort>[] = INCIDENT_SORTS.map(
  (value) => ({ value, label: SORT_LABELS[value] }),
);
