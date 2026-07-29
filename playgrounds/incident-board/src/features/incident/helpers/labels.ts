import type { IncidentSeverity, IncidentStatus } from "@api/Incident.api";

// The display vocabulary both pages share. A list and a detail that spelled
// "acknowledged" differently would be a bug nobody notices for months.
export const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
