import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberQueries } from "@api/Member.queries";
import type { Member } from "@api/Member.api";
import { teamQueries } from "@api/Team.queries";
import { teamApi, type CreateTeamInput } from "@api/Team.api";

export interface TeamFormContainerState {
  addTeam: (input: CreateTeamInput) => Promise<void>;
  memberSearch: string;
  setMemberSearch: (q: string) => void;
  members: Member[];
  isFetching: boolean;
}

export function useTeamFormContainer(): TeamFormContainerState {
  const queryClient = useQueryClient();

  // Hook-scoped query param: the search keyword feeds the members query key,
  // so the hook owns the value and exposes the setter for the picker input.
  const [memberSearch, setMemberSearch] = useState("");

  const { data: members, isFetching } = useQuery(
    memberQueries.list(memberSearch || undefined),
  );

  // The teams list lives on another page; its cache is keyed, so this
  // mutation invalidates it directly without subscribing. No optimistic
  // update: the form navigates to the list on save, so nobody observes the
  // optimistic state, and the hook lacks member names (only ids), so it
  // cannot build a faithful row anyway.
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
