import { useReportFacade } from "./Report.facade";
import { ReportListComponent } from "./ReportList.component";

export function ReportListContainer() {
  const { reports, isPending, isFetching } = useReportFacade();
  return (
    <ReportListComponent
      reports={reports}
      isPending={isPending}
      isFetching={isFetching}
    />
  );
}
