import { useTeamFormContainer } from "./TeamForm.container.hook";
import { TeamFormComponent } from "./TeamForm.component";

export function TeamFormContainer() {
  const { addTeam, memberSearch, setMemberSearch, members, isFetching } =
    useTeamFormContainer();
  return (
    <TeamFormComponent
      addTeam={addTeam}
      memberSearch={memberSearch}
      setMemberSearch={setMemberSearch}
      members={members}
      isFetching={isFetching}
    />
  );
}
