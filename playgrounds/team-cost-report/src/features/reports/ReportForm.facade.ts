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

  // The reports list lives in another page's facade, but its cache is keyed,
  // so this mutation updates/invalidates it directly without subscribing.
  const reportsKey = reportQueries.list().queryKey;

  const addMutation = useMutation({
    mutationFn: (input: CreateReportInput) => reportApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: reportsKey });
      const previous = queryClient.getQueryData<ReportSummary[]>(reportsKey);
      queryClient.setQueryData<ReportSummary[]>(reportsKey, (old) => [
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
      queryClient.setQueryData(reportsKey, context?.previous);
    },
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
