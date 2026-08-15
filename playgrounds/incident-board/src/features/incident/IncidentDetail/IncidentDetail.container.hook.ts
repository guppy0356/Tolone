import { useQuery } from "@tanstack/react-query";
import { TypedStatusError } from "../../../lib/api-client";
import { incidentQueries } from "@api/Incident.queries";
import type { IncidentComment, IncidentDetail } from "@api/Incident.api";

export interface IncidentDetailContainerParams {
  incidentId: string;
  /**
   * Whether the comments are being looked at. The hook is told this as a
   * plain boolean rather than a tab name: which tab spells it is the URL's
   * business, and the URL is not this layer's business.
   */
  withComments: boolean;
}

export interface IncidentDetailContainerState {
  detail: IncidentDetail | undefined;
  comments: IncidentComment[];
  isDetailPending: boolean;
  isDetailNotFound: boolean;
  isCommentsLoading: boolean;
}

export function useIncidentDetailContainer({
  incidentId,
  withComments,
}: IncidentDetailContainerParams): IncidentDetailContainerState {
  const { data: detail, isPending, error } = useQuery(
    incidentQueries.detail(incidentId),
  );

  const { data: comments, isLoading: isCommentsLoading } = useQuery({
    ...incidentQueries.comments(incidentId),
    // Consumer-specific, so it stays at the call site: the comments are only
    // worth fetching once the reader asks for them.
    enabled: withComments,
  });

  return {
    detail,
    comments: comments ?? [],
    isDetailPending: isPending,
    // The generated client's own error type, read directly: it is the
    // project's client, so a 404 is already a first-class thing to ask about.
    isDetailNotFound: error instanceof TypedStatusError && error.status === 404,
    // Not `isPending`: a query held back by `enabled` is pending too, and the
    // comments panel must not show a skeleton for something nobody requested.
    isCommentsLoading,
  };
}
