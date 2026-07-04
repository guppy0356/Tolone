import { useNavigate } from "@tanstack/react-router";
import type { TeamFormContainerState } from "./TeamForm.container.hook";
import { useTeamFormComponent } from "./TeamForm.component.hook";
import { TeamMemberList } from "./components/TeamMemberList.component";
import { TeamMemberPicker } from "./components/TeamMemberPicker.component";

// The component hook is called here in the exported form component (not a
// memo'd body) so the form state survives fetching toggles.
export function TeamFormComponent({
  addTeam,
  memberSearch,
  setMemberSearch,
  members,
  isFetching,
}: TeamFormContainerState) {
  const navigate = useNavigate();
  const {
    nameField,
    picked,
    membersError,
    addMember,
    removeMember,
    setRate,
    candidates,
    isPickerOpen,
    openPicker,
    closePicker,
    canSubmit,
    isSubmitting,
    handleSubmit,
  } = useTeamFormComponent({
    addTeam,
    setMemberSearch,
    members,
    onSaved: () => navigate({ to: "/teams" }),
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
          value={nameField.value}
          onChange={(e) => nameField.onChange(e.target.value)}
          onBlur={nameField.onBlur}
          placeholder="e.g. Platform"
          aria-invalid={nameField.error ? true : undefined}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        />
        {nameField.error && (
          <p className="mt-1 text-sm text-red-500">{nameField.error}</p>
        )}
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
          isSearching={isFetching}
          onAdd={addMember}
          onClose={closePicker}
        />
        {membersError && (
          <p className="mt-1 text-sm text-red-500">{membersError}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "Saving…" : "Save team"}
        </button>
      </div>
    </form>
  );
}
