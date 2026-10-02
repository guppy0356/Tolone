import { useQuery } from "@tanstack/react-query";
import { applicationQueries } from "@api/Application.queries";
import type { ApplicationDetail, Interview } from "@api/Application.api";
import { TypedStatusError } from "../../../lib/api-client";

export interface ApplicationDetailContainerParams {
  applicationId: string;
  // The Container translates the tab into this; the hook never sees the URL.
  withInterviews: boolean;
}

export interface ApplicationDetailContainerState {
  detail: ApplicationDetail | undefined;
  interviews: Interview[];
  isDetailPending: boolean;
  isDetailRefetching: boolean;
  // Gated by `enabled`, so isLoading: isPending would also mean "not asked yet".
  isInterviewsLoading: boolean;
  isNotFound: boolean;
}

export function useApplicationDetailContainer({
  applicationId,
  withInterviews,
}: ApplicationDetailContainerParams): ApplicationDetailContainerState {
  const detailQuery = useQuery(applicationQueries.detail(applicationId));
  const interviewsQuery = useQuery({
    ...applicationQueries.interviews(applicationId),
    enabled: withInterviews,
  });

  const isNotFound =
    detailQuery.error instanceof TypedStatusError && detailQuery.error.status === 404;

  return {
    detail: detailQuery.data,
    interviews: interviewsQuery.data ?? [],
    isDetailPending: detailQuery.isPending,
    isDetailRefetching: detailQuery.isRefetching,
    isInterviewsLoading: interviewsQuery.isLoading,
    isNotFound,
  };
}
