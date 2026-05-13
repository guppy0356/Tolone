import { useMemo } from "react";
import type { ReportSummary } from "./Report.api";

export interface ReportListPresenterProps {
  reports: ReportSummary[];
}

export interface ReportListRow {
  id: string;
  name: string;
  teamCount: number;
  formattedCreatedAt: string;
}

export interface ReportListPresenter {
  rows: ReportListRow[];
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function useReportListPresenter({
  reports,
}: ReportListPresenterProps): ReportListPresenter {
  const rows = useMemo<ReportListRow[]>(
    () =>
      [...reports]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((r) => ({
          id: r.id,
          name: r.name,
          teamCount: r.teamIds.length,
          formattedCreatedAt: dateFormatter.format(new Date(r.createdAt)),
        })),
    [reports],
  );

  return { rows };
}
