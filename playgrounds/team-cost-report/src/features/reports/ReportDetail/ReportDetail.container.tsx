import { useParams } from "@tanstack/react-router";
import { useReportDetailContainer } from "./ReportDetail.container.hook";
import { ReportDetailComponent } from "./ReportDetail.component";

export function ReportDetailContainer() {
  const { reportId } = useParams({ from: "/reports/$reportId" });
  const { detail, isPending, isRefetching, isNotFound } = useReportDetailContainer({
    reportId,
  });
  return (
    <ReportDetailComponent
      detail={detail}
      isPending={isPending}
      isRefetching={isRefetching}
      isNotFound={isNotFound}
    />
  );
}
