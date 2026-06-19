import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamQueries } from "../teams/Team.queries";
import type { Team } from "../teams/Team.api";
import { reportQueries } from "./Report.queries";
import {
  reportApi,
  type ReportSummary,
  type CreateReportInput,
} from "./Report.api";

export interface ReportFormFacade {
  teams: Team[];
  isPending: boolean;
  addReport: (input: CreateReportInput) => Promise<ReportSummary>;
}

export function useReportFormFacade(): ReportFormFacade {
  const queryClient = useQueryClient();

  const { data: teams, isPending } = useQuery(teamQueries.list());

  // The reports list lives in another page's facade; its cache is keyed, so this
  // mutation invalidates it directly without subscribing. No optimistic update:
  // the form navigates to the new report's detail on save, so it never observes
  // the optimistic state, and onSettled refetches anyway.
  const reportsKey = reportQueries.list().queryKey;

  const addMutation = useMutation({
    mutationFn: (input: CreateReportInput) => reportApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reportsKey });
    },
  });

  const addReport = useCallback(
    (input: CreateReportInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );

  return { teams: teams ?? [], isPending, addReport };
}
