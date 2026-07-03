import { useQuery } from "@tanstack/react-query";
import { reportQueries } from "@api/Report.queries";
import type { ReportSummary } from "@api/Report.api";

export interface ReportListContainerState {
  reports: ReportSummary[];
  isPending: boolean;
  isRefetching: boolean;
}

export function useReportListContainer(): ReportListContainerState {
  const { data, isPending, isRefetching } = useQuery(reportQueries.list());
  return { reports: data ?? [], isPending, isRefetching };
}
