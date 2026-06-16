import { useNavigate } from "@tanstack/react-router";
import type { TeamFormFacade } from "./TeamForm.facade";
import { useTeamFormPresenter } from "./TeamForm.presenter";
import { TeamMemberList } from "./TeamMemberList.component";
import { TeamMemberPicker } from "./TeamMemberPicker.component";

type TeamFormComponentProps = Pick<
  TeamFormFacade,
  | "addTeam"
  | "memberSearch"
  | "setMemberSearch"
  | "members"
  | "isFetchingMembers"
>;

export function TeamFormComponent({
  addTeam,
  memberSearch,
  setMemberSearch,
  members,
  isFetchingMembers,
}: TeamFormComponentProps) {
  const navigate = useNavigate();
  const {
    teamName,
    setTeamName,
    picked,
    addMember,
    removeMember,
    setRate,
    canSubmit,
    submitting,
    handleSubmit,
    candidates,
    isPickerOpen,
    openPicker,
    closePicker,
  } = useTeamFormPresenter({
    addTeam,
    onSaved: () => navigate({ to: "/teams" }),
    members,
    setMemberSearch,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="mx-auto max-w-2xl space-y-6 p-6"
    >
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New team</h1>
      </header>

      <div>
        <label
          htmlFor="team-name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Team name
        </label>
        <input
          id="team-name"
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g. Platform"
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-700">Members</h2>
        <TeamMemberList
          picked={picked}
          onRateChange={setRate}
          onRemove={removeMember}
        />
        <button
          type="button"
          onClick={openPicker}
          className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          + Add member
        </button>
        <TeamMemberPicker
          open={isPickerOpen}
          query={memberSearch}
          setQuery={setMemberSearch}
          candidates={candidates}
          isSearching={isFetchingMembers}
          onAdd={addMember}
          onClose={closePicker}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "Saving…" : "Save team"}
        </button>
      </div>
    </form>
  );
}
