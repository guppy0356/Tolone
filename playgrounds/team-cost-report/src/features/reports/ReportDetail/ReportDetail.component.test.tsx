import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ReportDetailComponent } from "./ReportDetail.component";
import type { ReportDetailContainerState } from "./ReportDetail.container.hook";

const baseDetail: NonNullable<ReportDetailContainerState["detail"]> = {
  id: "r1",
  name: "Q1 2026 Cost",
  teams: [
    {
      id: "t1",
      name: "Platform",
      members: [{ memberId: "m1", name: "Ada", hourlyRate: 120 }],
    },
    {
      id: "t2",
      name: "Mobile",
      members: [{ memberId: "m3", name: "Grace", hourlyRate: 105 }],
    },
  ],
  totalPayment: 12345,
  monthly: [
    {
      month: "2026-01",
      payments: [
        { teamId: "t1", amount: 5000 },
        { teamId: "t2", amount: 3000 },
      ],
    },
    {
      month: "2026-02",
      payments: [
        { teamId: "t1", amount: 2500 },
        { teamId: "t2", amount: 1845 },
      ],
    },
  ],
};

const baseState: ReportDetailContainerState = {
  detail: baseDetail,
  isPending: false,
  isRefetching: false,
  isNotFound: false,
};

test("renders name, formatted total, and each team", async () => {
  const screen = await render(<ReportDetailComponent {...baseState} />);

  await expect.element(screen.getByText("Q1 2026 Cost")).toBeInTheDocument();
  await expect.element(screen.getByText("$12,345")).toBeInTheDocument();
  // Recharts legend duplicates team names, so target the first match.
  await expect.element(screen.getByText("Platform").first()).toBeInTheDocument();
  await expect.element(screen.getByText("Mobile").first()).toBeInTheDocument();
});

test("shows the skeleton while pending", async () => {
  const screen = await render(
    <ReportDetailComponent {...baseState} isPending detail={undefined} />,
  );

  expect(
    screen.container.querySelectorAll(".animate-pulse").length,
  ).toBeGreaterThan(0);
});

test("shows a not-found message on 404", async () => {
  const screen = await render(
    <ReportDetailComponent {...baseState} isNotFound detail={undefined} />,
  );

  await expect
    .element(screen.getByText(/Report not found/))
    .toBeInTheDocument();
});

test("shows an empty message when there is nothing to chart", async () => {
  const screen = await render(
    <ReportDetailComponent
      {...baseState}
      detail={{ ...baseDetail, monthly: [], teams: [] }}
    />,
  );

  await expect
    .element(screen.getByText(/No data to display/))
    .toBeInTheDocument();
});
