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

export interface ReportFacade {
  reports: ReportSummary[];
  teams: Team[];
  isPending: boolean;
  isFetching: boolean;
  addReport: (input: CreateReportInput) => Promise<ReportSummary>;
}

export function useReportFacade(): ReportFacade {
  const queryClient = useQueryClient();

  const reportsQuery = reportQueries.list();
  const { data, isPending, isFetching } = useQuery(reportsQuery);

  const { data: teams } = useQuery(teamQueries.list());

  const addMutation = useMutation({
    mutationFn: (input: CreateReportInput) => reportApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: reportsQuery.queryKey });
      const previous = queryClient.getQueryData<ReportSummary[]>(
        reportsQuery.queryKey,
      );
      queryClient.setQueryData<ReportSummary[]>(reportsQuery.queryKey, (old) => [
        ...(old ?? []),
        {
          id: crypto.randomUUID(),
          name: input.name,
          teamIds: input.teamIds,
          createdAt: new Date().toISOString(),
        },
      ]);
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(reportsQuery.queryKey, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reportsQuery.queryKey });
    },
  });

  const addReport = useCallback(
    (input: CreateReportInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );

  return {
    reports: data ?? [],
    teams: teams ?? [],
    isPending,
    isFetching,
    addReport,
  };
}
