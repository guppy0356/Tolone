import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRow, ChartSeries } from "./ReportDetail.presenter";

export interface ReportChartProps {
  chartData: ChartRow[];
  series: ChartSeries[];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const ReportChart = memo(function ReportChart({
  chartData,
  series,
}: ReportChartProps) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis
          tickFormatter={(v) => compactCurrencyFormatter.format(Number(v))}
        />
        <Tooltip
          formatter={(value) => currencyFormatter.format(Number(value))}
        />
        <Legend />
        {series.map((s) => (
          <Bar
            key={s.teamId}
            dataKey={s.teamId}
            name={s.name}
            stackId="payment"
            fill={s.color}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
});
