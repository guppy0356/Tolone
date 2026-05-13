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
import type { MonthlyPaymentRow } from "./Report.api";

export interface ReportChartProps {
  monthly: MonthlyPaymentRow[];
  teamNames: string[];
  colors: string[];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const ReportChart = memo(function ReportChart({
  monthly,
  teamNames,
  colors,
}: ReportChartProps) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={monthly}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(v) => currencyFormatter.format(Number(v))} />
        <Tooltip
          formatter={(value) => currencyFormatter.format(Number(value))}
        />
        <Legend />
        {teamNames.map((name, i) => (
          <Bar
            key={name}
            dataKey={name}
            stackId="payment"
            fill={colors[i % colors.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
});
