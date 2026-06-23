import { useQuery } from "@tanstack/react-query";
import { reportQueries } from "./Report.queries";
import type { ReportSummary } from "./Report.api";

export interface ReportListFacade {
  reports: ReportSummary[];
  isPending: boolean;
  isRefetching: boolean;
}

export function useReportListFacade(): ReportListFacade {
  const { data, isPending, isRefetching } = useQuery(reportQueries.list());
  return { reports: data ?? [], isPending, isRefetching };
}
