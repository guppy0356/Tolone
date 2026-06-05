import { useNavigate } from "@tanstack/react-router";
import { useTeamFacade } from "../teams/Team.facade";
import { useReportFacade } from "./Report.facade";
import { ReportFormComponent } from "./ReportForm.component";

export function ReportFormContainer() {
  const { teams } = useTeamFacade();
  const { addReport } = useReportFacade();
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
