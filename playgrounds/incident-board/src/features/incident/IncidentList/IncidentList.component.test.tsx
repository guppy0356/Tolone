import { RouterProvider } from "@tanstack/react-router";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { IncidentSummary } from "@api/Incident.api";
import type { User } from "@api/User.api";
import { createIncidentRouter } from "../../../test/incident-router";
import type { IncidentListSearch } from "../Incident.search";
import {
  IncidentListComponent,
  type IncidentListComponentProps,
} from "./IncidentList.component";

const alice: User = { id: "u1", name: "Alice Chen" };

const incidents: IncidentSummary[] = [
  {
    id: "1",
    key: "INC-1043",
    title: "Checkout API returning 502",
    status: "open",
    severity: "critical",
    assignee: alice,
    openedAt: "2026-07-28T22:14:00Z",
  },
  {
    id: "2",
    key: "INC-1042",
    title: "Nightly backup skipped",
    status: "resolved",
    severity: "low",
    assignee: null,
    openedAt: "2026-07-26T02:00:00Z",
  },
];

const defaultSearch: IncidentListSearch = {
  status: [],
  sort: "-openedAt",
  page: 1,
};

async function renderList({
  initialUrl = "/incidents",
  ...props
}: Partial<IncidentListComponentProps> & { initialUrl?: string } = {}) {
  const router = createIncidentRouter({
    initialUrl,
    children: (
      <IncidentListComponent
        incidents={incidents}
        total={2}
        totalPages={1}
        assignees={[alice]}
        isIncidentsPending={false}
        isIncidentsRefetching={false}
        isAssigneesPending={false}
        search={defaultSearch}
        {...props}
      />
    ),
  });
  const screen = await render(<RouterProvider router={router} />);
  return { screen, router };
}

test("renders one row per incident, with derived labels", async () => {
  const { screen } = await renderList();

  await expect.element(screen.getByText("INC-1043")).toBeInTheDocument();
  // "Critical" is also a filter option, so the severity badge is read off the
  // row rather than looked up by text.
  await expect
    .element(screen.getByRole("link", { name: /Checkout API returning 502/ }))
    .toHaveTextContent("Critical");
  await expect
    .element(screen.getByText("Alice Chen · 2026-07-28 22:14 UTC"))
    .toBeInTheDocument();
  // A missing assignee is a label, not an empty cell.
  await expect
    .element(screen.getByText("Unassigned · 2026-07-26 02:00 UTC"))
    .toBeInTheDocument();
});

test("changing a filter goes back to the first page", async () => {
  const { screen, router } = await renderList({
    initialUrl: "/incidents?page=4",
    search: { ...defaultSearch, page: 4 },
  });

  await screen.getByLabelText("Open").click();

  // page=4 is gone from the URL, which is how "page 1" is spelled once the
  // default is stripped.
  await vi.waitFor(() => {
    expect(decodeURIComponent(router.state.location.searchStr)).toBe(
      '?status=["open"]',
    );
  });
  expect(router.state.matches.at(-1)?.search).toMatchObject({ page: 1 });
});

test("paging keeps the filters and does not reset the page", async () => {
  const { screen, router } = await renderList({
    initialUrl: "/incidents?severity=high",
    search: { ...defaultSearch, severity: "high" },
    totalPages: 3,
  });

  await screen.getByText("Next").click();

  await vi.waitFor(() => {
    expect(router.state.location.search).toMatchObject({
      severity: "high",
      page: 2,
    });
  });
});

test("keeps default values out of the URL", async () => {
  const { screen, router } = await renderList({
    initialUrl: "/incidents?severity=critical&page=2",
    search: { ...defaultSearch, severity: "critical", page: 2 },
  });

  await screen.getByLabelText("Severity").selectOptions("Any severity");

  // severity cleared, page reset to its default, sort never left its default:
  // nothing is left to say.
  await vi.waitFor(() => {
    expect(router.state.location.searchStr).toBe("");
  });
});

test("an incident's URL says which incident, and nothing about the list", async () => {
  const { screen } = await renderList({
    search: { ...defaultSearch, severity: "critical", page: 2 },
  });

  const href = screen
    .getByRole("link", { name: /Checkout API returning 502/ })
    .element()
    .getAttribute("href");

  expect(href).toBe("/incidents/1");
});

test("skeletons the list but keeps the filters usable while loading", async () => {
  const { screen } = await renderList({
    incidents: [],
    isIncidentsPending: true,
  });

  await expect.element(screen.getByLabelText("Severity")).toBeInTheDocument();
  await expect.element(screen.getByText("INC-1043")).not.toBeInTheDocument();
});

test("dims the list, without a skeleton, while a filter change is in flight", async () => {
  const { screen } = await renderList({ isIncidentsRefetching: true });

  await expect.element(screen.getByText("INC-1043")).toBeInTheDocument();
  expect(
    screen.getByText("INC-1043").element().closest(".opacity-50"),
  ).not.toBeNull();
});
