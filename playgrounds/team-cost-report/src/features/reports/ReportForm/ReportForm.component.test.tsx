import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReportFormComponent } from "./ReportForm.component";
import type { ReportFormContainerState } from "./ReportForm.container.hook";
import type { ReportSummary } from "@api/Report.api";
import type { Team } from "@api/Team.api";

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

const createdReport: ReportSummary = {
  id: "r-new",
  name: "Q2 Cost",
  teamIds: ["t1", "t2"],
  createdAt: "2026-05-14T00:00:00Z",
};

// The Component calls useNavigate, so tests mount it inside a minimal router
// whose root renders the form; the detail route exists only as the
// post-save navigation target.
async function renderForm(overrides: Partial<ReportFormContainerState> = {}) {
  const state: ReportFormContainerState = {
    teams: sampleTeams,
    isPending: false,
    addReport: vi.fn(async () => createdReport),
    ...overrides,
  };
  const rootRoute = createRootRoute({
    component: () => (
      <ReportFormComponent
        teams={state.teams}
        isPending={state.isPending}
        addReport={state.addReport}
      />
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/reports/$reportId",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, detailRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

test("keeps save disabled until name and team selection are valid", async () => {
  const screen = await renderForm();
  const save = screen.getByRole("button", { name: "Save report" });

  await expect.element(save).toBeDisabled();

  await screen.getByLabelText("Report name").fill("Q2 Cost");
  await expect.element(save).toBeDisabled();

  await screen.getByLabelText("Platform").click();
  await expect.element(save).toBeEnabled();
});

test("submits the schema output — trimmed name and selected team ids", async () => {
  const addReport = vi.fn(async () => createdReport);
  const screen = await renderForm({ addReport });

  await screen.getByLabelText("Report name").fill("  Q2 Cost  ");
  await screen.getByLabelText("Platform").click();
  await screen.getByLabelText("Mobile").click();
  await screen.getByRole("button", { name: "Save report" }).click();

  await vi.waitFor(() => {
    expect(addReport).toHaveBeenCalledWith({
      name: "Q2 Cost",
      teamIds: ["t1", "t2"],
    });
  });
  // The form resets after a successful save.
  await expect.element(screen.getByLabelText("Report name")).toHaveValue("");
});

test("surfaces schema errors once a field goes invalid", async () => {
  const screen = await renderForm();

  const nameInput = screen.getByLabelText("Report name");
  await nameInput.fill("Q2 Cost");
  await nameInput.fill("");
  await expect
    .element(screen.getByText("Report name is required"))
    .toBeInTheDocument();

  const platform = screen.getByLabelText("Platform");
  await platform.click();
  await platform.click();
  await expect
    .element(screen.getByText("Select at least one team"))
    .toBeInTheDocument();
});

test("disables the button and shows progress while saving", async () => {
  const addReport = vi.fn(
    (): Promise<ReportSummary> => new Promise(() => {}),
  );
  const screen = await renderForm({ addReport });

  await screen.getByLabelText("Report name").fill("Q2 Cost");
  await screen.getByLabelText("Platform").click();
  await screen.getByRole("button", { name: "Save report" }).click();

  await expect
    .element(screen.getByRole("button", { name: "Saving…" }))
    .toBeDisabled();
});

test("shows the empty message when no teams exist", async () => {
  const screen = await renderForm({ teams: [] });

  await expect
    .element(screen.getByText(/No teams available/))
    .toBeInTheDocument();
});

test("shows the teams skeleton while teams load", async () => {
  const screen = await renderForm({ teams: [], isPending: true });

  expect(
    screen.container.querySelectorAll(".animate-pulse").length,
  ).toBeGreaterThan(0);
});
