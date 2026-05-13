import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { reportApi, type ReportDetail } from "./Report.api";

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
  const { data, isPending, isFetching, error } = useQuery({
    queryKey: ["reports", reportId],
    queryFn: () => reportApi.getDetail(reportId),
    placeholderData: keepPreviousData,
    retry: false,
  });

  const isNotFound =
    !!error &&
    typeof error === "object" &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 404;

  return {
    detail: data,
    isPending,
    isFetching,
    isNotFound,
  };
}
