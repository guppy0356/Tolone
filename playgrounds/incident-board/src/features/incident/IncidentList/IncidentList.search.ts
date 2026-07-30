import { stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SORTS,
  INCIDENT_STATUSES,
  type IncidentListParams,
  type IncidentSort,
  type IncidentStatus,
} from "@api/Incident.api";

// Not `as const`: these are also the argument to the router's
// `stripSearchParams`, which expects the mutable search shape.
const incidentListSearchDefaults = {
  status: [] as IncidentStatus[],
  sort: "-openedAt" as IncidentSort,
  page: 1,
};

// `.default` then `.catch` on every field, in that order and both of them:
// `.default` is what makes the field optional on the way *in*, so a link may
// name only the params it changes; `.catch` is what makes a hand-mangled URL
// degrade to that default instead of throwing the page away.
const incidentListSearchSchema = z.object({
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

// The route options that make a URL mean what this module says it means:
// parsing on the way in, and dropping defaults on the way out, so that
// /incidents and /incidents?status=[]&sort=-openedAt&page=1 are the same
// address. The route file spreads these rather than restating them, and so
// does the story/test router — a harness that skipped the middleware would be
// exercising a URL the app never produces.
export const incidentListRouteOptions = {
  validateSearch: incidentListSearchSchema,
  search: {
    middlewares: [
      stripSearchParams<IncidentListSearch>(incidentListSearchDefaults),
    ],
  },
};
