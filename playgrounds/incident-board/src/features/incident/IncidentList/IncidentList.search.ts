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

// Not `as const`: this is also the argument to `stripSearchParams`, which
// expects the mutable search shape.
const incidentListSearchDefaults = {
  status: [] as IncidentStatus[],
  sort: "-openedAt" as IncidentSort,
  page: 1,
};

// A mangled value degrades to its default rather than failing the route: this
// URL is ordinary editable text, and a typo or a stale bookmark should still
// render a list.
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
  page: z
    .number()
    .int()
    .min(1)
    .default(incidentListSearchDefaults.page)
    .catch(incidentListSearchDefaults.page),
}) satisfies z.ZodType<IncidentListParams, unknown>;

export type IncidentListSearch = z.infer<typeof incidentListSearchSchema>;

// Parsing on the way in, stripping defaults on the way out, so that /incidents
// and /incidents?status=[]&sort=-openedAt&page=1 are one address.
export const incidentListRouteOptions = {
  validateSearch: incidentListSearchSchema,
  search: {
    middlewares: [
      stripSearchParams<IncidentListSearch>(incidentListSearchDefaults),
    ],
  },
};
