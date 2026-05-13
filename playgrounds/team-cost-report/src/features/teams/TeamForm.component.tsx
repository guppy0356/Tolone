import { memo } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { TeamFacade } from "./Team.facade";
import { useTeamFormPresenter } from "./TeamForm.presenter";
import { TeamMemberPicker } from "./TeamMemberPicker.component";

interface TeamFormViewProps {
  addTeam: TeamFacade["addTeam"];
  onSaved?: () => void;
}

const TeamFormView = memo(function TeamFormView({
  addTeam,
  onSaved,
}: TeamFormViewProps) {
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
  } = useTeamFormPresenter({ addTeam, onSaved });

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

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-700">Members</h2>
        <TeamMemberPicker
          picked={picked}
          onAdd={addMember}
          onRemove={removeMember}
          onRateChange={setRate}
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
});

export function TeamFormComponent({ addTeam }: TeamFacade) {
  const navigate = useNavigate();
  return (
    <TeamFormView addTeam={addTeam} onSaved={() => navigate({ to: "/teams" })} />
  );
}
