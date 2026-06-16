import { useReportFacade } from "./Report.facade";
import { ReportListComponent } from "./ReportList.component";

export function ReportListContainer() {
  const { reports, isReportsPending, isReportsFetching } = useReportFacade();
  return (
    <ReportListComponent
      reports={reports}
      isReportsPending={isReportsPending}
      isReportsFetching={isReportsFetching}
    />
  );
}
