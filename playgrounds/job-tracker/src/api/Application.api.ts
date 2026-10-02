import { api } from "../lib/api-client";
import {
  ApplicationSort,
  ApplicationStatus,
  InterviewKind,
  type ApplicationDetail,
  type ApplicationPage,
  type ApplicationSummary,
  type CreateApplicationInput,
  type Interview,
  type UpdateApplicationInput,
  type get_ListApplications,
} from "../lib/api.gen";

export type {
  ApplicationDetail,
  ApplicationPage,
  ApplicationSort,
  ApplicationStatus,
  ApplicationSummary,
  CreateApplicationInput,
  Interview,
  InterviewKind,
  UpdateApplicationInput,
};

// The contract's enum members, read off the generated zod enums so no second
// copy is kept by hand. They say which members exist, not the order a page
// offers them in.
export const APPLICATION_STATUSES: readonly ApplicationStatus[] = ApplicationStatus.options;
export const APPLICATION_SORTS: readonly ApplicationSort[] = ApplicationSort.options;
export const INTERVIEW_KINDS: readonly InterviewKind[] = InterviewKind.options;

// A query-parameter type is generated onto the endpoint, not among the schemas.
export type ApplicationListParams = NonNullable<get_ListApplications["parameters"]["query"]>;

export const applicationApi = {
  getList: (params: ApplicationListParams): Promise<ApplicationPage> =>
    api.get("/api/applications", { query: params }),
  getDetail: (id: string): Promise<ApplicationDetail> =>
    api.get("/api/applications/{applicationId}", { path: { applicationId: id } }),
  getInterviews: (id: string): Promise<Interview[]> =>
    api.get("/api/applications/{applicationId}/interviews", { path: { applicationId: id } }),
  create: (input: CreateApplicationInput): Promise<ApplicationDetail> =>
    api.post("/api/applications", { body: input }),
  update: (id: string, input: UpdateApplicationInput): Promise<ApplicationDetail> =>
    api.patch("/api/applications/{applicationId}", { path: { applicationId: id }, body: input }),
  delete: (id: string) =>
    api.delete("/api/applications/{applicationId}", { path: { applicationId: id } }),
};
