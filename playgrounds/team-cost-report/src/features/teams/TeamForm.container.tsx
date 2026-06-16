import { useTeamFormFacade } from "./TeamForm.facade";
import { TeamFormComponent } from "./TeamForm.component";

export function TeamFormContainer() {
  const {
    addTeam,
    memberSearch,
    setMemberSearch,
    members,
    isFetchingMembers,
  } = useTeamFormFacade();
  return (
    <TeamFormComponent
      addTeam={addTeam}
      memberSearch={memberSearch}
      setMemberSearch={setMemberSearch}
      members={members}
      isFetchingMembers={isFetchingMembers}
    />
  );
}
