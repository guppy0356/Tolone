import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberQueries } from "./Members.queries";
import type { Member } from "./Members.api";
import { teamQueries } from "./Team.queries";
import { teamApi, type Team, type CreateTeamInput } from "./Team.api";

export interface TeamFacade {
  teams: Team[];
  isPending: boolean;
  isFetching: boolean;
  addTeam: (input: CreateTeamInput) => Promise<void>;
  memberSearch: string;
  setMemberSearch: (q: string) => void;
  members: Member[];
  isFetchingMembers: boolean;
}

export function useTeamFacade(): TeamFacade {
  const queryClient = useQueryClient();

  const teamsQuery = teamQueries.all();
  const {
    data: teams,
    isPending,
    isFetching,
  } = useQuery(teamsQuery);

  const [memberSearch, setMemberSearch] = useState("");

  const { data: members, isFetching: isFetchingMembers } = useQuery(
    memberQueries.list(memberSearch || undefined),
  );

  const addMutation = useMutation({
    mutationFn: (input: CreateTeamInput) => teamApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: teamsQuery.queryKey });
      const previous = queryClient.getQueryData<Team[]>(teamsQuery.queryKey);
      queryClient.setQueryData<Team[]>(teamsQuery.queryKey, (old) => [
        ...(old ?? []),
        {
          id: crypto.randomUUID(),
          name: input.name,
          members: input.members.map((m) => ({
            memberId: m.memberId,
            name: "",
            hourlyRate: m.hourlyRate,
          })),
        },
      ]);
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(teamsQuery.queryKey, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teamsQuery.queryKey });
    },
  });

  const addTeam = useCallback(
    async (input: CreateTeamInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation.mutateAsync],
  );

  return {
    teams: teams ?? [],
    isPending,
    isFetching,
    addTeam,
    memberSearch,
    setMemberSearch,
    members: members ?? [],
    isFetchingMembers,
  };
}
