import { useReportListFacade } from "./ReportList.facade";
import { ReportListComponent } from "./ReportList.component";

export function ReportListContainer() {
  const { reports, isPending, isFetching } = useReportListFacade();
  return (
    <ReportListComponent
      reports={reports}
      isPending={isPending}
      isFetching={isFetching}
    />
  );
}
