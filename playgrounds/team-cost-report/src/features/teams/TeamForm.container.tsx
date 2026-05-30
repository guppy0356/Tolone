import { useTeamFacade } from "./Team.facade";
import { TeamFormComponent } from "./TeamForm.component";

export function TeamFormContainer() {
  const { addTeam } = useTeamFacade();
  return <TeamFormComponent addTeam={addTeam} />;
}
