import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ReportChart } from "./ReportChart.component";
import type { ChartRow, ChartSeries } from "../ReportDetail.component.hook";

const series: ChartSeries[] = [
  { teamId: "t1", name: "Platform", color: "#3b82f6" },
  { teamId: "t2", name: "Mobile", color: "#10b981" },
];

const chartData: ChartRow[] = [
  { month: "2026-01", t1: 5000, t2: 3000 },
  { month: "2026-02", t1: 2500, t2: 1845 },
];

// ResponsiveContainer measures its parent, so the chart only renders inside a
// container with real dimensions — the reason this can't be a catalog story.
test("renders a bar per team and month inside a sized container", async () => {
  const screen = await render(
    <div style={{ width: 800 }}>
      <ReportChart chartData={chartData} series={series} />
    </div>,
  );

  // The tooltip repeats the series names whenever the pointer rests on the
  // chart — a click in an earlier test file can leave it there — so read the
  // legend items instead of getByText.
  await expect
    .poll(() =>
      Array.from(
        screen.container.querySelectorAll(".recharts-legend-item-text"),
        (item) => item.textContent,
      ),
    )
    .toEqual(expect.arrayContaining(series.map((s) => s.name)));

  await expect
    .poll(
      () => screen.container.querySelectorAll(".recharts-bar-rectangle").length,
    )
    .toBe(series.length * chartData.length);
});
