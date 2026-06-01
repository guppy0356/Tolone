import { useCallback, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { membersApi, type Member } from "./Members.api";
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

const teamKeys = {
  all: ["teams"] as const,
};

const memberKeys = {
  all: ["members"] as const,
  search: (q: string) => [...memberKeys.all, { q }] as const,
};

export function useTeamFacade(): TeamFacade {
  const queryClient = useQueryClient();

  const {
    data: teams,
    isPending,
    isFetching,
  } = useQuery({
    queryKey: teamKeys.all,
    queryFn: teamApi.getAll,
    placeholderData: keepPreviousData,
  });

  const [memberSearch, setMemberSearch] = useState("");

  const { data: members, isFetching: isFetchingMembers } = useQuery({
    queryKey: memberSearch ? memberKeys.search(memberSearch) : memberKeys.all,
    queryFn: () => membersApi.getAll(memberSearch || undefined),
    placeholderData: keepPreviousData,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateTeamInput) => teamApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: teamKeys.all });
      const previous = queryClient.getQueryData<Team[]>(teamKeys.all);
      queryClient.setQueryData<Team[]>(teamKeys.all, (old) => [
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
      queryClient.setQueryData(teamKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
  });

  const addTeam = useCallback(
    async (input: CreateTeamInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation],
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
