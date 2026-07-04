import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { TeamListComponent } from "./TeamList.component";
import type { TeamListContainerState } from "./TeamList.container.hook";

const baseTeams: TeamListContainerState["teams"] = [
  {
    id: "t1",
    name: "Platform",
    members: [
      { memberId: "m1", name: "Ada", hourlyRate: 120 },
      { memberId: "m2", name: "Alan", hourlyRate: 110 },
    ],
  },
  {
    id: "t2",
    name: "Design",
    members: [{ memberId: "m3", name: "Grace", hourlyRate: 95 }],
  },
];

const baseState: TeamListContainerState = {
  teams: baseTeams,
  isPending: false,
  isRefetching: false,
};

// Link needs a router context; the route only exists so the href resolves.
function renderWithRouter(state: TeamListContainerState) {
  const rootRoute = createRootRoute({
    component: () => <TeamListComponent {...state} />,
  });
  const newRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/teams/new",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([newRoute]),
  });
  return render(<RouterProvider router={router} />);
}

test("renders each team with member count and formatted rates", async () => {
  const screen = await renderWithRouter(baseState);

  await expect.element(screen.getByText("Platform")).toBeInTheDocument();
  const rows = Array.from(screen.container.querySelectorAll("ul > li"));
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent("Platform");
  expect(rows[0]).toHaveTextContent(
    "2 members — Ada ($120/h), Alan ($110/h)",
  );
  expect(rows[1]).toHaveTextContent("Design");
  expect(rows[1]).toHaveTextContent("1 member — Grace ($95/h)");
});

test("omits the rates suffix when a team has no members", async () => {
  const screen = await renderWithRouter({
    ...baseState,
    teams: [{ id: "t1", name: "Platform", members: [] }],
  });

  await expect.element(screen.getByText("Platform")).toBeInTheDocument();
  const row = screen.container.querySelector("ul > li");
  expect(row).toHaveTextContent("0 members");
  expect(row).not.toHaveTextContent("—");
});

test("links the header to the new-team form", async () => {
  const screen = await renderWithRouter(baseState);

  await expect
    .element(screen.getByRole("link", { name: "New team" }))
    .toHaveAttribute("href", "/teams/new");
});

test("shows the empty message when there are no teams", async () => {
  const screen = await renderWithRouter({ ...baseState, teams: [] });

  await expect.element(screen.getByText(/No teams yet/)).toBeInTheDocument();
});

test("shows the li-granular skeleton while pending — header stays", async () => {
  const screen = await renderWithRouter({
    ...baseState,
    teams: [],
    isPending: true,
  });

  await expect
    .element(screen.getByRole("link", { name: "New team" }))
    .toBeInTheDocument();
  expect(
    screen.container.querySelectorAll(".animate-pulse").length,
  ).toBeGreaterThan(0);
  expect(screen.container.textContent).not.toContain("No teams yet");
});

test("keeps content visible but dimmed while refetching", async () => {
  const screen = await renderWithRouter({ ...baseState, isRefetching: true });

  await expect.element(screen.getByText("Platform")).toBeInTheDocument();
  expect(screen.container.querySelector(".opacity-50")).not.toBeNull();
});
