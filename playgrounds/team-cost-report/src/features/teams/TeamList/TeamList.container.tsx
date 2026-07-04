import { useTeamListContainer } from "./TeamList.container.hook";
import { TeamListComponent } from "./TeamList.component";

export function TeamListContainer() {
  const { teams, isPending, isRefetching } = useTeamListContainer();
  return (
    <TeamListComponent
      teams={teams}
      isPending={isPending}
      isRefetching={isRefetching}
    />
  );
}
