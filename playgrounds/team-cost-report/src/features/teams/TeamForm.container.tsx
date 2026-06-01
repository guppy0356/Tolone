import { useTeamFacade } from "./Team.facade";
import { TeamFormComponent } from "./TeamForm.component";

export function TeamFormContainer() {
  const {
    addTeam,
    memberSearch,
    setMemberSearch,
    members,
    isFetchingMembers,
  } = useTeamFacade();
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
