import { stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";
import type {
  IncidentListParams,
  IncidentSort,
  IncidentStatus,
} from "@api/Incident.api";

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

export type IncidentTab = (typeof INCIDENT_TABS)[number];

// Not `as const`: these are also the argument to the router's
// `stripSearchParams`, which expects the mutable search shape.
export const incidentListSearchDefaults = {
  status: [] as IncidentStatus[],
  sort: "-openedAt" as IncidentSort,
  page: 1,
};

// `.default` then `.catch` on every field, in that order and both of them:
// `.default` is what makes the field optional on the way *in*, so a link may
// name only the params it changes; `.catch` is what makes a hand-mangled URL
// degrade to that default instead of throwing the page away.
export const incidentListSearchSchema = z.object({
  status: z
    .array(z.enum(INCIDENT_STATUSES))
    .default(incidentListSearchDefaults.status)
    .catch(incidentListSearchDefaults.status),
  severity: z.enum(INCIDENT_SEVERITIES).optional().catch(undefined),
  assignee: z.string().optional().catch(undefined),
  sort: z
    .enum(INCIDENT_SORTS)
    .default(incidentListSearchDefaults.sort)
    .catch(incidentListSearchDefaults.sort),
  // Not `z.coerce`: the router JSON-parses search values, so `?page=2` already
  // arrives as a number, and coercion would widen the input type to `unknown`.
  page: z
    .number()
    .int()
    .min(1)
    .default(incidentListSearchDefaults.page)
    .catch(incidentListSearchDefaults.page),
}) satisfies z.ZodType<IncidentListParams, unknown>;

export type IncidentListSearch = z.infer<typeof incidentListSearchSchema>;

// The detail page carries the list's filters as well as its own tab, so that
// returning to the list restores the filters from the URL alone — the URL is
// the source of truth for this state, so nothing else may remember it.
export const incidentDetailSearchDefaults = {
  ...incidentListSearchDefaults,
  tab: "timeline" as IncidentTab,
};

export const incidentDetailSearchSchema = incidentListSearchSchema.extend({
  tab: z
    .enum(INCIDENT_TABS)
    .default(incidentDetailSearchDefaults.tab)
    .catch(incidentDetailSearchDefaults.tab),
});

export type IncidentDetailSearch = z.infer<typeof incidentDetailSearchSchema>;

/**
 * The detail search minus what only the detail page means — i.e. the address
 * of the list the reader came from. Projecting one schema onto the other is a
 * property of the two contracts, so it lives with them.
 */
export function toListSearch({
  tab: _tab,
  ...listSearch
}: IncidentDetailSearch): IncidentListSearch {
  return listSearch;
}

// The route options that make a URL mean what this module says it means:
// parsing on the way in, and dropping defaults on the way out, so that
// /incidents and /incidents?status=[]&sort=-openedAt&page=1 are the same
// address. Route files spread these rather than restating them, and so does
// the story/test router — a harness that skipped the middleware would be
// exercising a URL the app never produces.
export const incidentListSearchConfig = {
  validateSearch: incidentListSearchSchema,
  search: {
    middlewares: [
      stripSearchParams<IncidentListSearch>(incidentListSearchDefaults),
    ],
  },
};

export const incidentDetailSearchConfig = {
  validateSearch: incidentDetailSearchSchema,
  search: {
    middlewares: [
      stripSearchParams<IncidentDetailSearch>(incidentDetailSearchDefaults),
    ],
  },
};
