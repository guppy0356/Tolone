import { useTeamListFacade } from "./TeamList.facade";
import { TeamListComponent } from "./TeamList.component";

export function TeamListContainer() {
  const { teams, isPending, isRefetching } = useTeamListFacade();
  return (
    <TeamListComponent
      teams={teams}
      isPending={isPending}
      isRefetching={isRefetching}
    />
  );
}
