import { useReportFacade } from "./Report.facade";
import { ReportFormComponent } from "./ReportForm.component";

export function ReportFormContainer() {
  const { teams, addReport } = useReportFacade();
  return <ReportFormComponent teams={teams} addReport={addReport} />;
}
