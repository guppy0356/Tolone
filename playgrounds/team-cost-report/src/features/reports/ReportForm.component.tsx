import { memo } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ReportFacade } from "./Report.facade";
import type { TeamFacade } from "../teams/Team.facade";
import { useReportFormPresenter } from "./ReportForm.presenter";

export interface ReportFormProps {
  teams: TeamFacade["teams"];
  addReport: ReportFacade["addReport"];
}

interface ReportFormViewProps extends ReportFormProps {
  onSaved: (reportId: string) => void;
}

const ReportFormView = memo(function ReportFormView({
  teams,
  addReport,
  onSaved,
}: ReportFormViewProps) {
  const {
    reportName,
    setReportName,
    selectedTeamIds,
    toggleTeam,
    isTeamSelected,
    canSubmit,
    submitting,
    handleSubmit,
  } = useReportFormPresenter({
    addReport,
    onSaved: (r) => onSaved(r.id),
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
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          placeholder="e.g. Q2 2026 Cost"
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">
          Teams ({selectedTeamIds.length} selected)
        </legend>
        {teams.length === 0 ? (
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
      </fieldset>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "Saving…" : "Save report"}
        </button>
      </div>
    </form>
  );
});

export function ReportFormComponent({ teams, addReport }: ReportFormProps) {
  const navigate = useNavigate();
  return (
    <ReportFormView
      teams={teams}
      addReport={addReport}
      onSaved={(reportId) =>
        navigate({ to: "/reports/$reportId", params: { reportId } })
      }
    />
  );
}
