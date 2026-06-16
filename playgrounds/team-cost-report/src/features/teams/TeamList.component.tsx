import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { TeamListFacade } from "./TeamList.facade";
import {
  useTeamListPresenter,
  type TeamListRow,
} from "./TeamList.presenter";

const TeamList = memo(function TeamList({ rows }: { rows: TeamListRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded border border-dashed border-gray-300 p-6 text-center text-gray-500">
        No teams yet. Create one to start tracking cost.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded border border-gray-200 bg-white p-4"
        >
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="mt-1 text-sm text-gray-500">
            {row.memberCount} member{row.memberCount === 1 ? "" : "s"}
            {row.formattedRates && ` — ${row.formattedRates}`}
          </div>
        </li>
      ))}
    </ul>
  );
});

function TeamListSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="rounded border border-gray-200 bg-white p-4"
        >
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export function TeamListComponent({
  teams,
  isPending,
  isFetching,
}: Pick<TeamListFacade, "teams" | "isPending" | "isFetching">) {
  const { rows } = useTeamListPresenter({ teams });

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <div className="p-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Teams</h1>
          <Link
            to="/teams/new"
            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            New team
          </Link>
        </header>
        {isPending ? <TeamListSkeleton /> : <TeamList rows={rows} />}
      </div>
    </div>
  );
}
