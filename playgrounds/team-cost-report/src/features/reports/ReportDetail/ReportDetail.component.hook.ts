import { useMemo } from "react";
import type { ReportDetail } from "@api/Report.api";

export interface ReportDetailComponentParams {
  detail: ReportDetail;
}

export interface ChartSeries {
  teamId: string;
  name: string;
  color: string;
}

// Recharts row: `month` plus one numeric key per team id. This dynamic-key
// shape is a display concern, so it lives here (derived) rather than in the
// API contract.
export type ChartRow = { month: string } & Record<string, number | string>;

export interface ReportDetailComponentState {
  chartData: ChartRow[];
  series: ChartSeries[];
  formattedTotal: string;
}

const PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function useReportDetailComponent({
  detail,
}: ReportDetailComponentParams): ReportDetailComponentState {
  const series = useMemo<ChartSeries[]>(
    () =>
      detail.teams.map((t, i) => ({
        teamId: t.id,
        name: t.name,
        color: PALETTE[i % PALETTE.length],
      })),
    [detail.teams],
  );

  const chartData = useMemo<ChartRow[]>(
    () =>
      detail.monthly.map((m) => {
        const row: ChartRow = { month: m.month };
        for (const p of m.payments) row[p.teamId] = p.amount;
        return row;
      }),
    [detail.monthly],
  );

  const formattedTotal = useMemo(
    () => currencyFormatter.format(detail.totalPayment),
    [detail.totalPayment],
  );

  return { chartData, series, formattedTotal };
}
