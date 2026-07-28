import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { incidentApi, type IncidentListParams } from "./Incident.api";

export const incidentQueries = {
  all: () => ["incidents"] as const,

  // Prefix over every filter/sort/page variant.
  lists: () => [...incidentQueries.all(), "list"] as const,

  list: (params: IncidentListParams) =>
    queryOptions({
      queryKey: [...incidentQueries.lists(), params],
      queryFn: () => incidentApi.getList(params),
      // The list is the page's only content: without this, every filter change
      // would blank the table back to a skeleton.
      placeholderData: keepPreviousData,
    }),

  detail: (incidentId: string) =>
    queryOptions({
      queryKey: [...incidentQueries.all(), "detail", incidentId],
      queryFn: () => incidentApi.getDetail(incidentId),
      // A 404 is an answer, not a failure to reach the server.
      retry: false,
    }),

  // A sibling of `detail`, not a child of it: nesting would make every detail
  // invalidation drag the comments along, and no write site asks for that.
  comments: (incidentId: string) =>
    queryOptions({
      queryKey: [...incidentQueries.all(), "comments", incidentId],
      queryFn: () => incidentApi.getComments(incidentId),
      retry: false,
    }),
};
