import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { ReportFacade } from "./Report.facade";
import {
  useReportListPresenter,
  type ReportListRow,
} from "./ReportList.presenter";

const ReportList = memo(function ReportList({
  rows,
}: {
  rows: ReportListRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded border border-dashed border-gray-300 p-6 text-center text-gray-500">
        No reports yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            to="/reports/$reportId"
            params={{ reportId: row.id }}
            className="block rounded border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <div className="font-medium text-gray-900">{row.name}</div>
            <div className="mt-1 text-sm text-gray-500">
              {row.teamCount} team{row.teamCount === 1 ? "" : "s"}
              {" · "}
              {row.formattedCreatedAt}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
});

function ReportListSkeleton() {
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

export function ReportListComponent({
  reports,
  isReportsPending,
  isReportsFetching,
}: Pick<ReportFacade, "reports" | "isReportsPending" | "isReportsFetching">) {
  const { rows } = useReportListPresenter({ reports });

  return (
    <div
      className={`transition-opacity ${isReportsFetching ? "opacity-50" : ""}`}
    >
      <div className="p-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Reports</h1>
          <Link
            to="/reports/new"
            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            New report
          </Link>
        </header>
        {isReportsPending ? <ReportListSkeleton /> : <ReportList rows={rows} />}
      </div>
    </div>
  );
}
