import { useNavigate } from "@tanstack/react-router";
import type { ReportFormContainerState } from "./ReportForm.container.hook";
import { useReportFormComponent } from "./ReportForm.component.hook";

// Private Skeleton — li-granular placeholder for the teams list only; the
// form chrome stays rendered while teams load.
function TeamsSkeleton() {
  return (
    <ul className="space-y-1">
      {[0, 1, 2].map((i) => (
        <li key={i} className="rounded border border-gray-200 px-3 py-2">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

// The component hook is called here in the exported form component (not a
// memo'd body) so the form state survives the teams-loading toggle.
export function ReportFormComponent({
  teams,
  isPending,
  addReport,
}: ReportFormContainerState) {
  const navigate = useNavigate();
  const {
    nameField,
    selectedTeamIds,
    teamIdsError,
    toggleTeam,
    isTeamSelected,
    canSubmit,
    isSubmitting,
    handleSubmit,
  } = useReportFormComponent({
    addReport,
    onSaved: (r) =>
      navigate({ to: "/reports/$reportId", params: { reportId: r.id } }),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="mx-auto max-w-2xl space-y-6 p-6"
    >
      <header>
        <h1 className="text-2xl font-semibold">New report</h1>
      </header>

      <div>
        <label
          htmlFor="report-name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Report name
        </label>
        <input
          id="report-name"
          type="text"
          value={nameField.value}
          onChange={(e) => nameField.onChange(e.target.value)}
          onBlur={nameField.onBlur}
          placeholder="e.g. Q2 2026 Cost"
          aria-invalid={nameField.error ? true : undefined}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        />
        {nameField.error && (
          <p className="mt-1 text-sm text-red-500">{nameField.error}</p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">
          Teams ({selectedTeamIds.length} selected)
        </legend>
        {isPending ? (
          <TeamsSkeleton />
        ) : teams.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            No teams available. Create one first.
          </p>
        ) : (
          <ul className="space-y-1">
            {teams.map((team) => {
              const selected = isTeamSelected(team.id);
              return (
                <li key={team.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded border px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleTeam(team.id)}
                      className="size-4"
                    />
                    <span className="flex-1 text-gray-800">{team.name}</span>
                    <span className="text-xs text-gray-500">
                      {team.members.length} member
                      {team.members.length === 1 ? "" : "s"}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {teamIdsError && (
          <p className="mt-1 text-sm text-red-500">{teamIdsError}</p>
        )}
      </fieldset>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "Saving…" : "Save report"}
        </button>
      </div>
    </form>
  );
}
