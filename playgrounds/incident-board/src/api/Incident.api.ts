import { api } from "../lib/api-client";
import {
  incidentSeverityValues,
  incidentSortValues,
  incidentStatusValues,
  type components,
  type paths,
} from "../types/openapi";

// Generated types vanish at runtime, so the contract's enums are generated as
// values too (`--enum-values`). Both are renamed here, in one place, into the
// names the app uses — nothing downstream writes a member out by hand.
export type IncidentStatus = components["schemas"]["IncidentStatus"];
export const INCIDENT_STATUSES = incidentStatusValues;

export type IncidentSeverity = components["schemas"]["IncidentSeverity"];
export const INCIDENT_SEVERITIES = incidentSeverityValues;

export type IncidentSort = components["schemas"]["IncidentSort"];
export const INCIDENT_SORTS = incidentSortValues;

export type IncidentSummary = components["schemas"]["IncidentSummary"];
export type IncidentDetail = components["schemas"]["IncidentDetail"];
export type IncidentPage = components["schemas"]["IncidentPage"];
export type TimelineEvent = components["schemas"]["TimelineEvent"];
// `Comment` is a DOM lib global; the alias is prefixed so the domain type wins
// at every call site without a shadowing import.
export type IncidentComment = components["schemas"]["Comment"];

export type IncidentListParams = NonNullable<
  paths["/api/incidents"]["get"]["parameters"]["query"]
>;

// `status` is a repeatable parameter (OpenAPI style=form, explode=true), which
// a plain record cannot express, so the query string is built explicitly.
function toSearchParams(params: IncidentListParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const status of params.status ?? []) searchParams.append("status", status);
  if (params.severity) searchParams.set("severity", params.severity);
  if (params.assignee) searchParams.set("assignee", params.assignee);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  return searchParams;
}

export const incidentApi = {
  getList: (params: IncidentListParams) =>
    api.get("incidents", { searchParams: toSearchParams(params) }).json<IncidentPage>(),
  getDetail: (incidentId: string) =>
    api.get(`incidents/${incidentId}`).json<IncidentDetail>(),
  getComments: (incidentId: string) =>
    api.get(`incidents/${incidentId}/comments`).json<IncidentComment[]>(),
};
