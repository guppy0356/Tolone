import { useQuery } from "@tanstack/react-query";
import { reportQueries } from "./Report.queries";
import type { ReportSummary } from "./Report.api";

export interface ReportListFacade {
  reports: ReportSummary[];
  isPending: boolean;
  isFetching: boolean;
}

export function useReportListFacade(): ReportListFacade {
  const { data, isPending, isFetching } = useQuery(reportQueries.list());
  return { reports: data ?? [], isPending, isFetching };
}
