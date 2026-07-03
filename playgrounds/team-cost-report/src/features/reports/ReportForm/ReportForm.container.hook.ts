import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamQueries } from "@api/Team.queries";
import type { Team } from "@api/Team.api";
import { reportQueries } from "@api/Report.queries";
import {
  reportApi,
  type ReportSummary,
  type CreateReportInput,
} from "@api/Report.api";

export interface ReportFormContainerState {
  teams: Team[];
  isPending: boolean;
  addReport: (input: CreateReportInput) => Promise<ReportSummary>;
}

export function useReportFormContainer(): ReportFormContainerState {
  const queryClient = useQueryClient();

  const { data: teams, isPending } = useQuery(teamQueries.list());

  // The reports list lives on another page; its cache is keyed, so this
  // mutation invalidates it directly without subscribing. No optimistic
  // update: the form navigates to the new report's detail on save, so the
  // list is never on screen — nobody observes the optimistic state, and the
  // hook has no server-assigned id/createdAt to write without fabricating.
  const reportsKey = reportQueries.list().queryKey;

  const addMutation = useMutation({
    mutationFn: (input: CreateReportInput) => reportApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reportsKey });
    },
  });

  // Returns the created report so the Component can navigate to its detail.
  const addReport = useCallback(
    (input: CreateReportInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );

  return { teams: teams ?? [], isPending, addReport };
}
