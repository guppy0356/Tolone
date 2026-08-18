import { api } from "../lib/api-client";
import {
  IncidentSeverity,
  IncidentSort,
  IncidentStatus,
  type Comment,
  type get__api_incidents,
  type IncidentDetail,
  type IncidentPage,
} from "../lib/api.gen";

// Generated types vanish at runtime, so the contract's enums are generated as
// zod values too; `.options` recovers the member arrays. Both are renamed
// here, in one place, into the names the app uses — nothing downstream writes
// a member out by hand.
export type { IncidentSeverity, IncidentSort, IncidentStatus } from "../lib/api.gen";
export const INCIDENT_STATUSES = IncidentStatus.options;
export const INCIDENT_SEVERITIES = IncidentSeverity.options;
export const INCIDENT_SORTS = IncidentSort.options;

export type {
  IncidentDetail,
  IncidentPage,
  IncidentSummary,
  TimelineEvent,
} from "../lib/api.gen";
// `Comment` is a DOM lib global; the alias is prefixed so the domain type wins
// at every call site without a shadowing import.
export type IncidentComment = Comment;

export type IncidentListParams = NonNullable<
  get__api_incidents["parameters"]["query"]
>;

export const incidentApi = {
  getList: (params: IncidentListParams): Promise<IncidentPage> =>
    api.get("/api/incidents", { query: params }),
  getDetail: (incidentId: string): Promise<IncidentDetail> =>
    api.get("/api/incidents/{incidentId}", { path: { incidentId } }),
  getComments: (incidentId: string): Promise<IncidentComment[]> =>
    api.get("/api/incidents/{incidentId}/comments", { path: { incidentId } }),
};
