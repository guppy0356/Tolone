import { useQuery } from "@tanstack/react-query";
import { incidentQueries } from "@api/Incident.queries";
import { userQueries } from "@api/User.queries";
import type { IncidentListParams, IncidentSummary } from "@api/Incident.api";
import type { User } from "@api/User.api";

export interface IncidentListContainerParams {
  // The parsed URL search, handed down by the Container. The hook never reads
  // the URL itself, so it is testable without a router.
  params: IncidentListParams;
}

export interface IncidentListContainerState {
  incidents: IncidentSummary[];
  total: number;
  totalPages: number;
  assignees: User[];
  isIncidentsPending: boolean;
  isIncidentsRefetching: boolean;
  isAssigneesPending: boolean;
}

export function useIncidentListContainer({
  params,
}: IncidentListContainerParams): IncidentListContainerState {
  const { data, isPending, isRefetching } = useQuery(incidentQueries.list(params));

  // The assignee filter's options are a different resource; the shared cache
  // layer is reached through its own factory, never through this feature.
  const { data: assignees, isPending: isAssigneesPending } = useQuery(
    userQueries.list(),
  );

  return {
    incidents: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    assignees: assignees ?? [],
    isIncidentsPending: isPending,
    isIncidentsRefetching: isRefetching,
    isAssigneesPending,
  };
}
