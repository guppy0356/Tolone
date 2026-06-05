import { useParams } from "@tanstack/react-router";
import { useReportDetailFacade } from "./ReportDetail.facade";
import { ReportDetailComponent } from "./ReportDetail.component";

export function ReportDetailContainer() {
  const { reportId } = useParams({ from: "/reports/$reportId" });
  const { detail, isPending, isFetching, isNotFound } = useReportDetailFacade({
    reportId,
  });
  return (
    <ReportDetailComponent
      detail={detail}
      isPending={isPending}
      isFetching={isFetching}
      isNotFound={isNotFound}
    />
  );
}
