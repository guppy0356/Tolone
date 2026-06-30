import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { reportQueries } from "@api/Report.queries";
import type { ReportDetail } from "@api/Report.api";

export interface ReportDetailContainerParams {
  reportId: string;
}

export interface ReportDetailContainerState {
  detail: ReportDetail | undefined;
  isPending: boolean;
  isRefetching: boolean;
  isNotFound: boolean;
}

export function useReportDetailContainer({
  reportId,
}: ReportDetailContainerParams): ReportDetailContainerState {
  const { data, isPending, isRefetching, error } = useQuery(
    reportQueries.detail(reportId),
  );

  const isNotFound =
    error instanceof HTTPError && error.response.status === 404;

  return {
    detail: data,
    isPending,
    isRefetching,
    isNotFound,
  };
}
