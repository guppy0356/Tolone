import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  reportApi,
  type ReportSummary,
  type CreateReportInput,
} from "./Report.api";

export interface ReportFacade {
  reports: ReportSummary[];
  isPending: boolean;
  isFetching: boolean;
  addReport: (input: CreateReportInput) => Promise<ReportSummary>;
}

const reportKeys = {
  all: ["reports"] as const,
  detail: (id: string) => ["reports", id] as const,
};

export function useReportFacade(): ReportFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching } = useQuery({
    queryKey: reportKeys.all,
    queryFn: reportApi.getAll,
    placeholderData: keepPreviousData,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateReportInput) => reportApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: reportKeys.all });
      const previous = queryClient.getQueryData<ReportSummary[]>(reportKeys.all);
      queryClient.setQueryData<ReportSummary[]>(reportKeys.all, (old) => [
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
      queryClient.setQueryData(reportKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });

  const addReport = useCallback(
    (input: CreateReportInput) => addMutation.mutateAsync(input),
    [addMutation],
  );

  return {
    reports: data ?? [],
    isPending,
    isFetching,
    addReport,
  };
}
