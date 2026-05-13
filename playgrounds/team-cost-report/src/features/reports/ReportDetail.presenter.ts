import { useMemo } from "react";
import type { ReportDetail } from "./Report.api";

export interface ReportDetailPresenterProps {
  detail: ReportDetail;
}

export interface ReportDetailPresenter {
  teamNames: string[];
  colors: string[];
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

export function useReportDetailPresenter({
  detail,
}: ReportDetailPresenterProps): ReportDetailPresenter {
  const teamNames = useMemo(
    () => detail.teams.map((t) => t.name),
    [detail.teams],
  );

  const colors = useMemo(
    () => teamNames.map((_, i) => PALETTE[i % PALETTE.length]),
    [teamNames],
  );

  const formattedTotal = useMemo(
    () => currencyFormatter.format(detail.totalPayment),
    [detail.totalPayment],
  );

  return { teamNames, colors, formattedTotal };
}
