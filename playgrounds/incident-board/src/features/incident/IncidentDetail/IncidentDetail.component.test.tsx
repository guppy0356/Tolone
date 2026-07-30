import { RouterProvider } from "@tanstack/react-router";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import type { IncidentComment, IncidentDetail } from "@api/Incident.api";
import { createIncidentRouter } from "../../../test/incident-router";
import type { IncidentDetailSearch } from "./IncidentDetail.search";
import {
  IncidentDetailComponent,
  type IncidentDetailComponentProps,
} from "./IncidentDetail.component";

const detail: IncidentDetail = {
  id: "1043",
  key: "INC-1043",
  title: "Checkout API returning 502",
  status: "acknowledged",
  severity: "critical",
  assignee: null,
  openedAt: "2026-07-28T22:14:00Z",
  description: "Elevated 5xx from the checkout service.",
  timeline: [
    {
      id: "e1",
      at: "2026-07-28T22:14:00Z",
      kind: "opened",
      actor: "alertmanager",
      message: "Alert fired: error rate above threshold.",
    },
  ],
};

const comments: IncidentComment[] = [
  {
    id: "c1",
    author: "Bob Ito",
    body: "Support is only seeing reports from the EU region.",
    postedAt: "2026-07-28T22:44:00Z",
  },
];

const timelineSearch: IncidentDetailSearch = { tab: "timeline" };

async function renderDetail({
  initialUrl = "/incidents/1043",
  ...props
}: Partial<IncidentDetailComponentProps> & { initialUrl?: string } = {}) {
  const router = createIncidentRouter({
    initialUrl,
    children: (
      <IncidentDetailComponent
        detail={detail}
        comments={[]}
        isDetailPending={false}
        isDetailNotFound={false}
        isCommentsLoading={false}
        search={timelineSearch}
        {...props}
      />
    ),
  });
  const screen = await render(<RouterProvider router={router} />);
  return { screen, router };
}

test("shows the timeline tab with derived labels", async () => {
  const { screen } = await renderDetail();

  await expect.element(screen.getByText("INC-1043")).toBeInTheDocument();
  await expect.element(screen.getByText("Unassigned")).toBeInTheDocument();
  await expect
    .element(screen.getByText("2026-07-28 22:14 UTC · Opened · alertmanager"))
    .toBeInTheDocument();
});

test("the comments tab links to the same incident with tab=comments", async () => {
  const { screen } = await renderDetail();

  const href = screen
    .getByRole("link", { name: "Comments" })
    .element()
    .getAttribute("href");

  expect(href).toContain("/incidents/1043");
  expect(href).toContain("tab=comments");
});

test("only the tab in the URL reports itself current", async () => {
  const { screen } = await renderDetail({
    initialUrl: "/incidents/1043?tab=comments",
    search: { ...timelineSearch, tab: "comments" },
  });

  await expect
    .element(screen.getByRole("link", { name: "Comments" }))
    .toHaveAttribute("aria-current", "page");
  // Timeline is the default and so is absent from the URL, which makes it match
  // any tab at all unless the link asks for an exact comparison.
  await expect
    .element(screen.getByRole("link", { name: "Timeline" }))
    .not.toHaveAttribute("aria-current");
});

test("renders the comments once the tab is the one in the URL", async () => {
  const { screen } = await renderDetail({
    comments,
    search: { ...timelineSearch, tab: "comments" },
  });

  await expect
    .element(screen.getByText("Bob Ito · 2026-07-28 22:44 UTC"))
    .toBeInTheDocument();
  await expect
    .element(screen.getByText("Alert fired: error rate above threshold."))
    .not.toBeInTheDocument();
});

test("the link out goes to the list itself, whatever brought the reader here", async () => {
  const { screen } = await renderDetail({
    initialUrl: "/incidents/1043?tab=comments",
    search: { ...timelineSearch, tab: "comments" },
  });

  const href = screen
    .getByRole("link", { name: "All incidents" })
    .element()
    .getAttribute("href");

  expect(href).toBe("/incidents");
});

test("says so when the incident is gone, and still offers the way out", async () => {
  const { screen } = await renderDetail({
    detail: undefined,
    isDetailNotFound: true,
  });

  await expect
    .element(screen.getByText("That incident no longer exists."))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole("link", { name: "All incidents" }))
    .toBeInTheDocument();
});

test("skeletons the comments only while they are actually loading", async () => {
  const { screen } = await renderDetail({
    isCommentsLoading: true,
    search: { ...timelineSearch, tab: "comments" },
  });

  await expect.element(screen.getByText("No comments yet.")).not.toBeInTheDocument();
});
