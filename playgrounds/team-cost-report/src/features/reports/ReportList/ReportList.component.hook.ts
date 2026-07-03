import { useMemo } from "react";
import type { ReportSummary } from "@api/Report.api";

export interface ReportListComponentParams {
  reports: ReportSummary[];
}

export interface ReportListRow {
  id: string;
  name: string;
  teamCount: number;
  formattedCreatedAt: string;
}

export interface ReportListComponentState {
  rows: ReportListRow[];
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function useReportListComponent({
  reports,
}: ReportListComponentParams): ReportListComponentState {
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
