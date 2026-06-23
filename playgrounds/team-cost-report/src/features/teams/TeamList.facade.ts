import { useQuery } from "@tanstack/react-query";
import { teamQueries } from "./Team.queries";
import type { Team } from "./Team.api";

export interface TeamListFacade {
  teams: Team[];
  isPending: boolean;
  isRefetching: boolean;
}

export function useTeamListFacade(): TeamListFacade {
  const { data, isPending, isRefetching } = useQuery(teamQueries.list());
  return { teams: data ?? [], isPending, isRefetching };
}
