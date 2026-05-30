import { Link } from "@tanstack/react-router";
import type { TeamFacade } from "./Team.facade";
import { useTeamListPresenter } from "./TeamList.presenter";

export function TeamListSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-4 h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded border border-gray-200 bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export function TeamListComponent({ teams, isPending, isFetching }: TeamFacade) {
  if (isPending) return <TeamListSkeleton />;

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

        {rows.length === 0 ? (
          <p className="rounded border border-dashed border-gray-300 p-6 text-center text-gray-500">
            No teams yet. Create one to start tracking cost.
          </p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
