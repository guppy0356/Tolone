import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { RouterProvider } from "@tanstack/react-router";
import { createApplicationRouter } from "../../../test/application-router";
import { ApplicationListComponent, type ApplicationListComponentProps } from "./ApplicationList.component";

const applications = [
  { id: "1", companyName: "Acme", position: "Frontend Engineer", status: "interviewing" as const, appliedAt: "2026-09-01" },
  { id: "2", companyName: "Globex", position: "Product Engineer", status: "applied" as const, appliedAt: "2026-09-12" },
];

async function renderList(props: Partial<ApplicationListComponentProps> = {}, initialUrl?: string) {
  const search = props.search ?? { status: [], sort: "-appliedAt" as const, page: 1 };
  const router = createApplicationRouter({
    initialUrl,
    children: (
      <ApplicationListComponent
        applications={applications}
        total={applications.length}
        pageSize={10}
        isPending={false}
        isRefetching={false}
        updateStatus={vi.fn()}
        deleteApplication={vi.fn()}
        {...props}
        search={search}
      />
    ),
  });
  return { router, screen: await render(<RouterProvider router={router} />) };
}

test("renders each application with this page's wording", async () => {
  const { screen } = await renderList();
  await expect.element(screen.getByText("Frontend Engineer")).toBeVisible();
  await expect.element(screen.getByText("Acme · applied Sep 1, 2026")).toBeVisible();
  // The filter label and the row's select say it too — the badge is first in DOM order after them.
  await expect.element(screen.getByText("Interviewing", { exact: true }).nth(1)).toBeVisible();
});

test("ticking a status filter writes it to the URL and drops the page", async () => {
  const { router, screen } = await renderList(
    { search: { status: [], sort: "-appliedAt", page: 3 } },
    "/applications?page=3",
  );
  await screen.getByLabelText("Screening").click();
  await vi.waitFor(() => expect(router.state.location.search.status).toEqual(["screening"]));
  // A reset is an absence: page 1 is the default, so it leaves the address.
  expect(router.state.location.searchStr).not.toContain("page");
});

test("changing the sort keeps the filters and returns to page 1", async () => {
  const { router, screen } = await renderList(
    { search: { status: ["applied"], sort: "-appliedAt", page: 2 } },
    `/applications?status=${encodeURIComponent('["applied"]')}&page=2`,
  );
  await screen.getByLabelText("Sort").selectOptions("company");
  await vi.waitFor(() => expect(router.state.location.search.sort).toBe("company"));
  expect(router.state.location.search.status).toEqual(["applied"]);
  expect(router.state.location.searchStr).not.toContain("page");
});

test("changing a row's status calls updateStatus with that row", async () => {
  const updateStatus = vi.fn();
  const { screen } = await renderList({ updateStatus });
  await screen.getByLabelText("Status of Product Engineer").selectOptions("offer");
  expect(updateStatus).toHaveBeenCalledWith("2", "offer");
});

test("deleting a row calls deleteApplication with its id", async () => {
  const deleteApplication = vi.fn();
  const { screen } = await renderList({ deleteApplication });
  await screen.getByLabelText("Delete Frontend Engineer").click();
  expect(deleteApplication).toHaveBeenCalledWith("1");
});

test("shows the empty state and a loading skeleton", async () => {
  const empty = await renderList({ applications: [], total: 0 });
  await expect.element(empty.screen.getByText("No applications match.")).toBeVisible();

  const loading = await renderList({ isPending: true });
  await expect.element(loading.screen.getByLabelText("Loading applications")).toBeVisible();
});
