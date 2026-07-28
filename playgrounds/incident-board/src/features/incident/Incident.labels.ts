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

/**
 * The contract's timestamps are UTC ISO strings. Formatting them through Intl
 * would make the rendered text depend on the runner's locale and ICU version,
 * so the view model states the zone instead of guessing one.
 */
export function formatInstant(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}
