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

export const incidentApi = {
  getList: (params: IncidentListParams): Promise<IncidentPage> =>
    api.get("/api/incidents", { query: params }),
  getDetail: (incidentId: string): Promise<IncidentDetail> =>
    api.get("/api/incidents/{incidentId}", { path: { incidentId } }),
  getComments: (incidentId: string): Promise<IncidentComment[]> =>
    api.get("/api/incidents/{incidentId}/comments", { path: { incidentId } }),
};
