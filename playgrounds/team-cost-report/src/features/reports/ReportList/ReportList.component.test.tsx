import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReportListComponent } from "./ReportList.component";
import type { ReportListContainerState } from "./ReportList.container.hook";

const baseReports: ReportListContainerState["reports"] = [
  {
    id: "r2",
    name: "Older",
    teamIds: ["t1"],
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "r1",
    name: "Q1 Cost",
    teamIds: ["t1", "t2"],
    createdAt: "2026-04-01T00:00:00Z",
  },
];

const baseState: ReportListContainerState = {
  reports: baseReports,
  isPending: false,
  isRefetching: false,
};

// Link needs a router context; the routes only exist so hrefs resolve.
function renderWithRouter(state: ReportListContainerState) {
  const rootRoute = createRootRoute({
    component: () => <ReportListComponent {...state} />,
  });
  const newRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/reports/new",
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/reports/$reportId",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([newRoute, detailRoute]),
  });
  return render(<RouterProvider router={router} />);
}

test("renders rows newest-first with team count and formatted date", async () => {
  const screen = await renderWithRouter(baseState);

  await expect.element(screen.getByText("Q1 Cost")).toBeInTheDocument();
  const rows = Array.from(screen.container.querySelectorAll("li a"));
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent("Q1 Cost");
  expect(rows[0]).toHaveTextContent("2 teams · Apr 1, 2026");
  expect(rows[1]).toHaveTextContent("Older");
  expect(rows[1]).toHaveTextContent("1 team · Jan 15, 2026");
});

test("links each row to its report detail", async () => {
  const screen = await renderWithRouter(baseState);

  await expect
    .element(screen.getByRole("link", { name: /Q1 Cost/ }))
    .toHaveAttribute("href", "/reports/r1");
  await expect
    .element(screen.getByRole("link", { name: /Older/ }))
    .toHaveAttribute("href", "/reports/r2");
});

test("links the header to the new-report form", async () => {
  const screen = await renderWithRouter(baseState);

  await expect
    .element(screen.getByRole("link", { name: "New report" }))
    .toHaveAttribute("href", "/reports/new");
});

test("shows the empty message when there are no reports", async () => {
  const screen = await renderWithRouter({ ...baseState, reports: [] });

  await expect.element(screen.getByText(/No reports yet/)).toBeInTheDocument();
});

test("shows the li-granular skeleton while pending — header stays", async () => {
  const screen = await renderWithRouter({
    ...baseState,
    reports: [],
    isPending: true,
  });

  await expect
    .element(screen.getByRole("link", { name: "New report" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelectorAll(".animate-pulse").length,
  ).toBeGreaterThan(0);
  expect(screen.container.querySelectorAll("li a")).toHaveLength(0);
});

test("keeps content visible but dimmed while refetching", async () => {
  const screen = await renderWithRouter({ ...baseState, isRefetching: true });

  await expect.element(screen.getByText("Q1 Cost")).toBeInTheDocument();
  expect(screen.container.querySelector(".opacity-50")).not.toBeNull();
});
