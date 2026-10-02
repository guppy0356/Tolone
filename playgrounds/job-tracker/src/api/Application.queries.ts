import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { applicationApi, type ApplicationListParams } from "./Application.api";

export const applicationQueries = {
  all: () => ["applications"] as const,
  // Prefix: every filter / sort / page variant. Writes invalidate here.
  lists: () => [...applicationQueries.all(), "list"] as const,
  // Leaf: one variant, keyed by the parsed URL params.
  list: (params: ApplicationListParams) =>
    queryOptions({
      queryKey: [...applicationQueries.lists(), params],
      queryFn: () => applicationApi.getList(params),
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...applicationQueries.all(), "detail", id],
      queryFn: () => applicationApi.getDetail(id),
      retry: false,
    }),
  // Sibling of "detail", not a child: invalidating the detail must not refetch
  // the interviews, which no application write changes.
  interviews: (id: string) =>
    queryOptions({
      queryKey: [...applicationQueries.all(), "interviews", id],
      queryFn: () => applicationApi.getInterviews(id),
      retry: false,
    }),
};
