import { useReportFormContainer } from "./ReportForm.container.hook";
import { ReportFormComponent } from "./ReportForm.component";

export function ReportFormContainer() {
  const { teams, isPending, addReport } = useReportFormContainer();
  return (
    <ReportFormComponent
      teams={teams}
      isPending={isPending}
      addReport={addReport}
    />
  );
}
