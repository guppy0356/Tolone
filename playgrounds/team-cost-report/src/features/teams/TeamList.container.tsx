import { useTeamFacade } from "./Team.facade";
import { TeamListComponent } from "./TeamList.component";

export function TeamListContainer() {
  const facade = useTeamFacade();
  return <TeamListComponent {...facade} />;
}
