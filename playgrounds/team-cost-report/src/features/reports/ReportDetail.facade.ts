import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { reportQueries } from "./Report.queries";
import type { ReportDetail } from "./Report.api";

export interface ReportDetailFacadeProps {
  reportId: string;
}

export interface ReportDetailFacade {
  detail: ReportDetail | undefined;
  isPending: boolean;
  isFetching: boolean;
  isNotFound: boolean;
}

export function useReportDetailFacade({
  reportId,
}: ReportDetailFacadeProps): ReportDetailFacade {
  const { data, isPending, isFetching, error } = useQuery(
    reportQueries.detail(reportId),
  );

  const isNotFound =
    error instanceof HTTPError && error.response.status === 404;

  return {
    detail: data,
    isPending,
    isFetching,
    isNotFound,
  };
}
