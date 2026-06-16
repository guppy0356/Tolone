import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberQueries } from "./Members.queries";
import type { Member } from "./Members.api";
import { teamQueries } from "./Team.queries";
import { teamApi, type Team, type CreateTeamInput } from "./Team.api";

export interface TeamFormFacade {
  addTeam: (input: CreateTeamInput) => Promise<void>;
  memberSearch: string;
  setMemberSearch: (q: string) => void;
  members: Member[];
  isFetchingMembers: boolean;
}

export function useTeamFormFacade(): TeamFormFacade {
  const queryClient = useQueryClient();

  const [memberSearch, setMemberSearch] = useState("");

  const { data: members, isFetching: isFetchingMembers } = useQuery(
    memberQueries.list(memberSearch || undefined),
  );

  // The teams list lives in another page's facade; its cache is keyed, so this
  // mutation updates/invalidates it directly without subscribing.
  const teamsKey = teamQueries.list().queryKey;

  const addMutation = useMutation({
    mutationFn: (input: CreateTeamInput) => teamApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: teamsKey });
      const previous = queryClient.getQueryData<Team[]>(teamsKey);
      queryClient.setQueryData<Team[]>(teamsKey, (old) => [
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
      queryClient.setQueryData(teamsKey, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teamsKey });
    },
  });

  const addTeam = useCallback(
    async (input: CreateTeamInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation.mutateAsync],
  );

  return {
    addTeam,
    memberSearch,
    setMemberSearch,
    members: members ?? [],
    isFetchingMembers,
  };
}
