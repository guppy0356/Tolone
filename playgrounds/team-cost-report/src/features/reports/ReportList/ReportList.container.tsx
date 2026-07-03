import { useReportListContainer } from "./ReportList.container.hook";
import { ReportListComponent } from "./ReportList.component";

export function ReportListContainer() {
  const { reports, isPending, isRefetching } = useReportListContainer();
  return (
    <ReportListComponent
      reports={reports}
      isPending={isPending}
      isRefetching={isRefetching}
    />
  );
}
