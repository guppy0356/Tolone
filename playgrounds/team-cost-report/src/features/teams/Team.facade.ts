import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { teamApi, type Team, type CreateTeamInput } from "./Team.api";

export interface TeamFacade {
  teams: Team[];
  isPending: boolean;
  isFetching: boolean;
  addTeam: (input: CreateTeamInput) => Promise<void>;
}

const teamKeys = {
  all: ["teams"] as const,
};

export function useTeamFacade(): TeamFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching } = useQuery({
    queryKey: teamKeys.all,
    queryFn: teamApi.getAll,
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
    teams: data ?? [],
    isPending,
    isFetching,
    addTeam,
  };
}
