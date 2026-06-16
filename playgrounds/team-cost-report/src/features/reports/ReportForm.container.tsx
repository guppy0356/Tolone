import { useReportFormFacade } from "./ReportForm.facade";
import { ReportFormComponent } from "./ReportForm.component";

export function ReportFormContainer() {
  const { teams, isPending, addReport } = useReportFormFacade();
  return (
    <ReportFormComponent teams={teams} isPending={isPending} addReport={addReport} />
  );
}
