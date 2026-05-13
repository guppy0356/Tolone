import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { ReportListComponent } from "./ReportList.component";
import type { ReportFacade } from "./Report.facade";

async function renderWithRouter(facade: ReportFacade) {
  const rootRoute = createRootRoute({
    component: () => <ReportListComponent {...facade} />,
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
  await router.load();
  return render(<RouterProvider router={router} />);
}

const baseFacade: ReportFacade = {
  reports: [
    {
      id: "r1",
      name: "Q1 Cost",
      teamIds: ["t1", "t2"],
      createdAt: "2026-04-01T00:00:00Z",
    },
    {
      id: "r2",
      name: "Older",
      teamIds: ["t1"],
      createdAt: "2026-01-15T00:00:00Z",
    },
  ],
  isPending: false,
  isFetching: false,
  addReport: vi.fn(),
};

describe("ReportListComponent", () => {
  it("renders report rows sorted by createdAt desc", async () => {
    await renderWithRouter(baseFacade);
    const rows = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href")?.startsWith("/reports/r"));
    expect(rows[0]).toHaveTextContent("Q1 Cost");
    expect(rows[1]).toHaveTextContent("Older");
  });

  it("links to the detail route", async () => {
    await renderWithRouter(baseFacade);
    const detailLink = screen.getByRole("link", { name: /Q1 Cost/ });
    expect(detailLink).toHaveAttribute("href", "/reports/r1");
  });

  it("shows skeleton when pending", async () => {
    const { container } = await renderWithRouter({
      ...baseFacade,
      isPending: true,
      reports: [],
    });
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("shows empty state when no reports", async () => {
    await renderWithRouter({ ...baseFacade, reports: [] });
    expect(screen.getByText(/No reports yet/)).toBeInTheDocument();
  });
});
