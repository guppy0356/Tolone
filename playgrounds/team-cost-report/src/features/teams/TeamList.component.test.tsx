import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { TeamListComponent } from "./TeamList.component";
import type { TeamFacade } from "./Team.facade";

async function renderWithRouter(facade: TeamFacade) {
  const rootRoute = createRootRoute({
    component: () => <TeamListComponent {...facade} />,
  });
  const newRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/teams/new",
  });
  const router = createRouter({ routeTree: rootRoute.addChildren([newRoute]) });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const baseFacade: TeamFacade = {
  teams: [
    {
      id: "t1",
      name: "Platform",
      members: [
        { memberId: "m1", name: "Ada", hourlyRate: 120 },
        { memberId: "m2", name: "Alan", hourlyRate: 110 },
      ],
    },
  ],
  isPending: false,
  isFetching: false,
  addTeam: vi.fn(),
};

describe("TeamListComponent", () => {
  it("renders team rows", async () => {
    await renderWithRouter(baseFacade);
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText(/2 members/)).toBeInTheDocument();
    expect(screen.getByText(/Ada \(\$120\/h\)/)).toBeInTheDocument();
  });

  it("shows skeleton when pending", async () => {
    const { container } = await renderWithRouter({
      ...baseFacade,
      isPending: true,
      teams: [],
    });
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("shows empty state when no teams", async () => {
    await renderWithRouter({ ...baseFacade, teams: [] });
    expect(screen.getByText(/No teams yet/)).toBeInTheDocument();
  });
});
