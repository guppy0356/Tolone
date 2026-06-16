import { useReportFacade } from "./Report.facade";
import { ReportFormComponent } from "./ReportForm.component";

export function ReportFormContainer() {
  const { teams, isTeamsPending, addReport } = useReportFacade();
  return (
    <ReportFormComponent
      teams={teams}
      isTeamsPending={isTeamsPending}
      addReport={addReport}
    />
  );
}
