import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { TeamFormComponent } from "./TeamForm.component";
import type { TeamFormContainerState } from "./TeamForm.container.hook";
import type { Member } from "@api/Member.api";

const sampleMembers: Member[] = [
  { id: "m1", name: "Ada Lovelace" },
  { id: "m2", name: "Alan Turing" },
  { id: "m3", name: "Grace Hopper" },
];

// The Component calls useNavigate, so tests mount it inside a minimal router
// whose root renders the form; the teams route exists only as the post-save
// navigation target.
async function renderForm(overrides: Partial<TeamFormContainerState> = {}) {
  const state: TeamFormContainerState = {
    addTeam: vi.fn(async () => undefined),
    memberSearch: "",
    setMemberSearch: vi.fn(),
    members: sampleMembers,
    isFetching: false,
    ...overrides,
  };
  const rootRoute = createRootRoute({
    component: () => (
      <TeamFormComponent
        addTeam={state.addTeam}
        memberSearch={state.memberSearch}
        setMemberSearch={state.setMemberSearch}
        members={state.members}
        isFetching={state.isFetching}
      />
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
  });
  const teamsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/teams",
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, teamsRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const screen = await render(<RouterProvider router={router} />);
  return { screen, state };
}

test("keeps save disabled until name, a member, and a positive rate are set", async () => {
  const { screen } = await renderForm();
  const save = screen.getByRole("button", { name: "Save team" });

  await expect.element(save).toBeDisabled();

  await screen.getByLabelText("Team name").fill("Platform");
  await expect.element(save).toBeDisabled();

  await screen.getByRole("button", { name: "+ Add member" }).click();
  await screen.getByText("Ada Lovelace").click();
  await expect.element(save).toBeDisabled();

  await screen.getByLabelText("Hourly rate for Ada Lovelace").fill("120");
  await expect.element(save).toBeEnabled();
});

test("submits the schema output — trimmed name and picked members", async () => {
  const addTeam = vi.fn(async () => undefined);
  const { screen } = await renderForm({ addTeam });

  await screen.getByLabelText("Team name").fill("  Platform  ");
  await screen.getByRole("button", { name: "+ Add member" }).click();
  await screen.getByText("Ada Lovelace").click();
  await screen.getByLabelText("Hourly rate for Ada Lovelace").fill("120");
  await screen.getByRole("button", { name: "Save team" }).click();

  await vi.waitFor(() => {
    expect(addTeam).toHaveBeenCalledWith({
      name: "Platform",
      members: [{ memberId: "m1", hourlyRate: 120 }],
    });
  });
  // The form resets after a successful save.
  await expect.element(screen.getByLabelText("Team name")).toHaveValue("");
});

test("surfaces schema errors once a field goes invalid", async () => {
  const { screen } = await renderForm();

  const nameInput = screen.getByLabelText("Team name");
  await nameInput.fill("Platform");
  await nameInput.fill("");
  await expect
    .element(screen.getByText("Team name is required"))
    .toBeInTheDocument();

  await screen.getByRole("button", { name: "+ Add member" }).click();
  await screen.getByText("Ada Lovelace").click();
  await screen.getByRole("button", { name: "Remove Ada Lovelace" }).click();
  await expect
    .element(screen.getByText("Add at least one member"))
    .toBeInTheDocument();
});

test("surfaces a per-member rate error until a positive rate is entered", async () => {
  const { screen } = await renderForm();

  // A freshly added member enters with rate 0, so the per-row error shows at once.
  await screen.getByRole("button", { name: "+ Add member" }).click();
  await screen.getByText("Ada Lovelace").click();
  await expect
    .element(screen.getByText("Hourly rate must be greater than 0"))
    .toBeInTheDocument();

  await screen.getByLabelText("Hourly rate for Ada Lovelace").fill("120");
  await expect
    .element(screen.getByText("Hourly rate must be greater than 0"))
    .not.toBeInTheDocument();
});

test("disables the button and shows progress while saving", async () => {
  const addTeam = vi.fn((): Promise<void> => new Promise(() => {}));
  const { screen } = await renderForm({ addTeam });

  await screen.getByLabelText("Team name").fill("Platform");
  await screen.getByRole("button", { name: "+ Add member" }).click();
  await screen.getByText("Ada Lovelace").click();
  await screen.getByLabelText("Hourly rate for Ada Lovelace").fill("120");
  await screen.getByRole("button", { name: "Save team" }).click();

  await expect
    .element(screen.getByRole("button", { name: "Saving…" }))
    .toBeDisabled();
});

test("drives the container's search through the picker input", async () => {
  const { screen, state } = await renderForm();

  await screen.getByRole("button", { name: "+ Add member" }).click();
  await screen.getByRole("combobox", { name: "Search members" }).fill("Ada");

  expect(state.setMemberSearch).toHaveBeenCalledWith("Ada");
});

test("resets the member search when the picker closes", async () => {
  const { screen, state } = await renderForm();

  await screen.getByRole("button", { name: "+ Add member" }).click();
  await screen.getByRole("button", { name: "Close member picker" }).click();

  expect(state.setMemberSearch).toHaveBeenCalledWith("");
});

test("excludes already-picked members from the candidates", async () => {
  const { screen } = await renderForm();

  await screen.getByRole("button", { name: "+ Add member" }).click();
  await screen.getByText("Ada Lovelace").click();
  await screen.getByRole("button", { name: "+ Add member" }).click();

  await expect
    .element(screen.getByRole("button", { name: "Grace Hopper", exact: true }))
    .toBeInTheDocument();
  // exact — the picked row's "Remove Ada Lovelace" button must not match.
  await expect
    .element(screen.getByRole("button", { name: "Ada Lovelace", exact: true }))
    .not.toBeInTheDocument();
});
