import { useNavigate } from "@tanstack/react-router";
import { useReportFacade } from "./Report.facade";
import { ReportFormComponent } from "./ReportForm.component";

export function ReportFormContainer() {
  const { teams, addReport } = useReportFacade();
  const navigate = useNavigate();
  return (
    <ReportFormComponent
      teams={teams}
      addReport={addReport}
      onSaved={(reportId) =>
        navigate({ to: "/reports/$reportId", params: { reportId } })
      }
    />
  );
}
