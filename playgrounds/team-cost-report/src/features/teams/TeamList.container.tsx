import { useTeamFacade } from "./Team.facade";
import { TeamListComponent } from "./TeamList.component";

export function TeamListContainer() {
  const { teams, isPending, isFetching } = useTeamFacade();
  return (
    <TeamListComponent
      teams={teams}
      isPending={isPending}
      isFetching={isFetching}
    />
  );
}
