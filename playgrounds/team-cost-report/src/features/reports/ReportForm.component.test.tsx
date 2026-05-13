import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { ReportFormComponent, type ReportFormProps } from "./ReportForm.component";
import type { Team } from "../teams/Team.api";

const sampleTeams: Team[] = [
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
    name: "Mobile",
    members: [{ memberId: "m3", name: "Grace", hourlyRate: 105 }],
  },
];

async function renderWithRouter(props: ReportFormProps) {
  const rootRoute = createRootRoute({
    component: () => <ReportFormComponent {...props} />,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/reports/$reportId",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([detailRoute]),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("ReportFormComponent", () => {
  it("disables save until name + at least one team are present", async () => {
    const user = userEvent.setup();
    await renderWithRouter({ teams: sampleTeams, addReport: vi.fn() });

    const save = screen.getByRole("button", { name: /Save report/ });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText(/Report name/), "Q2 Cost");
    expect(save).toBeDisabled();

    await user.click(screen.getByLabelText(/Platform/));
    expect(save).not.toBeDisabled();
  });

  it("calls addReport with selected team ids", async () => {
    const addReport = vi.fn().mockResolvedValue({
      id: "r-new",
      name: "Q2 Cost",
      teamIds: ["t1", "t2"],
      createdAt: "2026-05-14T00:00:00Z",
    });
    const user = userEvent.setup();
    await renderWithRouter({ teams: sampleTeams, addReport });

    await user.type(screen.getByLabelText(/Report name/), "Q2 Cost");
    await user.click(screen.getByLabelText(/Platform/));
    await user.click(screen.getByLabelText(/Mobile/));
    await user.click(screen.getByRole("button", { name: /Save report/ }));

    expect(addReport).toHaveBeenCalledWith({
      name: "Q2 Cost",
      teamIds: ["t1", "t2"],
    });
  });

  it("shows empty state when no teams are available", async () => {
    await renderWithRouter({ teams: [], addReport: vi.fn() });
    expect(screen.getByText(/No teams available/)).toBeInTheDocument();
  });
});
