import { useQuery } from "@tanstack/react-query";
import { teamQueries } from "./Team.queries";
import type { Team } from "./Team.api";

export interface TeamListFacade {
  teams: Team[];
  isPending: boolean;
  isFetching: boolean;
}

export function useTeamListFacade(): TeamListFacade {
  const { data, isPending, isFetching } = useQuery(teamQueries.list());
  return { teams: data ?? [], isPending, isFetching };
}
