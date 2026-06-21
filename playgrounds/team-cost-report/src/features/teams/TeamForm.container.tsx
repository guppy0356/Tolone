import { useTeamFormFacade } from "./TeamForm.facade";
import { TeamFormComponent } from "./TeamForm.component";

export function TeamFormContainer() {
  const {
    addTeam,
    memberSearch,
    setMemberSearch,
    members,
    isFetching,
  } = useTeamFormFacade();
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
