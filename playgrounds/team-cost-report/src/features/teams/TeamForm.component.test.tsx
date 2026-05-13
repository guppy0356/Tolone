import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { TeamFormComponent } from "./TeamForm.component";
import type { TeamFacade } from "./Team.facade";

vi.mock("../members/Members.facade", () => ({
  useMembersFacade: ({ q }: { q: string }) => ({
    members: [
      { id: "m1", name: "Ada Lovelace" },
      { id: "m2", name: "Alan Turing" },
    ].filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase())),
    isPending: false,
    isFetching: false,
  }),
}));

async function renderWithRouter(facade: TeamFacade) {
  const rootRoute = createRootRoute({
    component: () => <TeamFormComponent {...facade} />,
  });
  const teamsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/teams",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([teamsRoute]),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const baseFacade: TeamFacade = {
  teams: [],
  isPending: false,
  isFetching: false,
  addTeam: vi.fn(),
};

describe("TeamFormComponent", () => {
  it("disables save until name + members with rates are present", async () => {
    const user = userEvent.setup();
    await renderWithRouter(baseFacade);

    const save = screen.getByRole("button", { name: /Save team/ });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText(/Team name/), "Platform");
    expect(save).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Add member/ }));
    await user.click(screen.getByText("Ada Lovelace"));
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Hourly rate for Ada Lovelace"), {
      target: { value: "120" },
    });
    expect(save).not.toBeDisabled();
  });

  it("submits CreateTeamInput when form is valid", async () => {
    const addTeam = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderWithRouter({ ...baseFacade, addTeam });

    await user.type(screen.getByLabelText(/Team name/), "Platform");
    await user.click(screen.getByRole("button", { name: /Add member/ }));
    await user.click(screen.getByText("Ada Lovelace"));
    fireEvent.change(screen.getByLabelText("Hourly rate for Ada Lovelace"), {
      target: { value: "120" },
    });
    await user.click(screen.getByRole("button", { name: /Save team/ }));

    expect(addTeam).toHaveBeenCalledWith({
      name: "Platform",
      members: [{ memberId: "m1", hourlyRate: 120 }],
    });
  });
});
