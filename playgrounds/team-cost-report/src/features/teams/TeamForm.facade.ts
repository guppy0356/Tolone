import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberQueries } from "./Member.queries";
import type { Member } from "./Member.api";
import { teamQueries } from "./Team.queries";
import { teamApi, type CreateTeamInput } from "./Team.api";

export interface TeamFormFacade {
  addTeam: (input: CreateTeamInput) => Promise<void>;
  memberSearch: string;
  setMemberSearch: (q: string) => void;
  members: Member[];
  isFetching: boolean;
}

export function useTeamFormFacade(): TeamFormFacade {
  const queryClient = useQueryClient();

  const [memberSearch, setMemberSearch] = useState("");

  const { data: members, isFetching } = useQuery(
    memberQueries.list(memberSearch || undefined),
  );

  // The teams list lives in another page's facade; its cache is keyed, so this
  // mutation invalidates it directly without subscribing. No optimistic update:
  // the form navigates to the list on save, so it never observes the optimistic
  // state, and the facade lacks member names (only ids), so it can't build a
  // faithful row anyway.
  const teamsKey = teamQueries.list().queryKey;

  const addMutation = useMutation({
    mutationFn: (input: CreateTeamInput) => teamApi.create(input),
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
    isFetching,
  };
}
