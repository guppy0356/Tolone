import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { RouterProvider } from "@tanstack/react-router";
import { createApplicationRouter } from "../../../test/application-router";
import {
  ApplicationDetailComponent,
  type ApplicationDetailComponentProps,
} from "./ApplicationDetail.component";

const detail = {
  id: "a1",
  companyId: "c1",
  companyName: "Acme",
  position: "Frontend Engineer",
  status: "offer" as const,
  appliedAt: "2026-09-01",
  notes: "",
};

async function renderDetail(
  props: Partial<ApplicationDetailComponentProps> = {},
  initialUrl = "/applications/a1",
) {
  const router = createApplicationRouter({
    initialUrl,
    children: (
      <ApplicationDetailComponent
        detail={detail}
        interviews={[]}
        isDetailPending={false}
        isDetailRefetching={false}
        isInterviewsLoading={false}
        isNotFound={false}
        search={{ tab: "overview" }}
        {...props}
      />
    ),
  });
  return { router, screen: await render(<RouterProvider router={router} />) };
}

test("composes the headline and words the absences", async () => {
  const { screen } = await renderDetail();
  await expect.element(screen.getByText("Frontend Engineer at Acme")).toBeVisible();
  await expect.element(screen.getByText("Offer received")).toBeVisible();
  await expect.element(screen.getByText("Salary: Not disclosed")).toBeVisible();
  await expect.element(screen.getByText("No notes yet")).toBeVisible();
});

test("switching tabs replaces the entry instead of stacking one", async () => {
  const { router, screen } = await renderDetail();
  const before = router.history.length;
  await screen.getByText("Interviews").click();
  await vi.waitFor(() => expect(router.state.location.search.tab).toBe("interviews"));
  expect(router.history.length).toBe(before);
});

test("renders the interviews pane with this page's wording", async () => {
  const { screen } = await renderDetail(
    {
      search: { tab: "interviews" },
      interviews: [
        { id: "i1", kind: "video", scheduledAt: "2026-10-14T10:00:00Z", interviewer: "Dana" },
      ],
    },
    "/applications/a1?tab=interviews",
  );
  await expect.element(screen.getByText("Video call")).toBeVisible();
  await expect.element(screen.getByText("Oct 14, 2026 10:00 UTC · Dana")).toBeVisible();
});

test("shows a skeleton while the interviews pane loads", async () => {
  const { screen } = await renderDetail(
    { search: { tab: "interviews" }, isInterviewsLoading: true },
    "/applications/a1?tab=interviews",
  );
  await expect.element(screen.getByLabelText("Loading interviews")).toBeVisible();
});

test("a missing application says so and still offers the list", async () => {
  const { screen } = await renderDetail({ detail: undefined, isNotFound: true });
  await expect.element(screen.getByText("This application does not exist.")).toBeVisible();
  await expect.element(screen.getByText("All applications")).toBeVisible();
});
