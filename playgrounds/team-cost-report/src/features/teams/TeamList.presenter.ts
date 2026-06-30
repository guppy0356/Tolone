import { useMemo } from "react";
import type { Team } from "@api/Team.api";

export interface TeamListPresenterProps {
  teams: Team[];
}

export interface TeamListRow {
  id: string;
  name: string;
  memberCount: number;
  formattedRates: string;
}

export interface TeamListPresenter {
  rows: TeamListRow[];
}

const rateFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function useTeamListPresenter({
  teams,
}: TeamListPresenterProps): TeamListPresenter {
  const rows = useMemo<TeamListRow[]>(
    () =>
      teams.map((team) => ({
        id: team.id,
        name: team.name,
        memberCount: team.members.length,
        formattedRates: team.members
          .map((m) => `${m.name} (${rateFormatter.format(m.hourlyRate)}/h)`)
          .join(", "),
      })),
    [teams],
  );

  return { rows };
}
