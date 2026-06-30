import { useQuery } from "@tanstack/react-query";
import { teamQueries } from "@api/Team.queries";
import type { Team } from "@api/Team.api";

export interface TeamListFacade {
  teams: Team[];
  isPending: boolean;
  isRefetching: boolean;
}

export function useTeamListFacade(): TeamListFacade {
  const { data, isPending, isRefetching } = useQuery(teamQueries.list());
  return { teams: data ?? [], isPending, isRefetching };
}
