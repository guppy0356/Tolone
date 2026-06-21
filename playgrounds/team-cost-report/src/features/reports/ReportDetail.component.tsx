import { memo } from "react";
import type { ReportDetailFacade } from "./ReportDetail.facade";
import { useReportDetailPresenter } from "./ReportDetail.presenter";
import { ReportChart } from "./ReportChart.component";

export function ReportDetailComponent({
  detail,
  isPending,
  isFetching,
  isNotFound,
}: Pick<
  ReportDetailFacade,
  "detail" | "isPending" | "isFetching" | "isNotFound"
>) {
  if (isNotFound) {
    return (
      <div className="p-6">
        <p className="rounded border border-dashed border-gray-300 p-6 text-center text-gray-500">
          Report not found.
        </p>
      </div>
    );
  }

  if (isPending || !detail) {
    return <ReportDetailSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <ReportDetail detail={detail} />
    </div>
  );
}

function ReportDetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="h-24 animate-pulse rounded bg-gray-200" />
      <div className="h-80 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

const ReportDetail = memo(function ReportDetail({
  detail,
}: {
  detail: NonNullable<ReportDetailFacade["detail"]>;
}) {
  const { chartData, series, formattedTotal } = useReportDetailPresenter({
    detail,
  });

  const hasData = chartData.length > 0 && series.length > 0;

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">{detail.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {detail.teams.length} team{detail.teams.length === 1 ? "" : "s"}
        </p>
      </header>

      <section className="rounded border border-gray-200 bg-white p-4">
        <div className="text-xs uppercase tracking-wide text-gray-500">
          Total payment
        </div>
        <div className="mt-1 text-3xl font-semibold text-gray-900">
          {formattedTotal}
        </div>
      </section>

      <section className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-700">
          Monthly payment by team
        </h2>
        {hasData ? (
          <ReportChart chartData={chartData} series={series} />
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">
            No data to display.
          </p>
        )}
      </section>

      <section className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-700">Teams</h2>
        <ul className="space-y-2">
          {detail.teams.map((team, i) => (
            <li
              key={team.id}
              className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block h-3 w-3 rounded"
                  style={{ backgroundColor: series[i]?.color }}
                />
                <span className="font-medium text-gray-800">{team.name}</span>
              </div>
              <span className="text-sm text-gray-500">
                {team.members.length} member
                {team.members.length === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
});
