import { z } from "zod";
import type { IncidentListParams } from "@api/Incident.api";

// The vocabulary of the incident URL. The generated OpenAPI types are types
// only, so the enum members have to exist once as runtime values; the
// `satisfies` below is what keeps this list pinned to the contract. The
// Component also renders its filter controls from these arrays, so there is
// exactly one place where "the statuses" are written down.
export const INCIDENT_STATUSES = ["open", "acknowledged", "resolved"] as const;
export const INCIDENT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const INCIDENT_SORTS = [
  "-openedAt",
  "openedAt",
  "-severity",
  "severity",
] as const;
export const INCIDENT_TABS = ["timeline", "comments"] as const;

export const incidentListSearchDefaults = {
  status: [],
  sort: "-openedAt",
  page: 1,
} as const;

// `.catch` on every field: a URL is user-editable input, and a hand-mangled
// query string should fall back to the default view rather than throw the page
// away. `.default` never fires for a caught field, so the fallbacks are the
// defaults themselves.
export const incidentListSearchSchema = z.object({
  status: z.array(z.enum(INCIDENT_STATUSES)).catch(() => []),
  severity: z.enum(INCIDENT_SEVERITIES).optional().catch(undefined),
  assignee: z.string().optional().catch(undefined),
  sort: z.enum(INCIDENT_SORTS).catch(incidentListSearchDefaults.sort),
  page: z.coerce.number().int().min(1).catch(incidentListSearchDefaults.page),
}) satisfies z.ZodType<IncidentListParams, unknown>;

export type IncidentListSearch = z.infer<typeof incidentListSearchSchema>;

// The detail page carries the list's filters as well as its own tab, so that
// returning to the list restores the filters from the URL alone — the URL is
// the source of truth for this state, so nothing else may remember it.
export const incidentDetailSearchDefaults = {
  ...incidentListSearchDefaults,
  tab: "timeline",
} as const;

export const incidentDetailSearchSchema = incidentListSearchSchema.extend({
  tab: z.enum(INCIDENT_TABS).catch(incidentDetailSearchDefaults.tab),
});

export type IncidentDetailSearch = z.infer<typeof incidentDetailSearchSchema>;
