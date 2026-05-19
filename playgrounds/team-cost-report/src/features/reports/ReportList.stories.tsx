import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReportListComponent } from "./ReportList.component";

const baseReports = [
  {
    id: "r1",
    name: "Q1 Cost",
    teamIds: ["t1", "t2"],
    createdAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "r2",
    name: "Older",
    teamIds: ["t1"],
    createdAt: "2026-01-15T00:00:00Z",
  },
];

const meta = {
  title: "features/ReportList",
  component: ReportListComponent,
  args: {
    reports: baseReports,
    isPending: false,
    isFetching: false,
    addReport: fn(),
  },
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
      const newRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/reports/new",
      });
      const detailRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/reports/$reportId",
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([newRoute, detailRoute]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof ReportListComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = canvas
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href")?.startsWith("/reports/r"));
    await expect(rows[0]).toHaveTextContent("Q1 Cost");
    await expect(rows[1]).toHaveTextContent("Older");
  },
};

export const LinksToDetail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const detailLink = canvas.getByRole("link", { name: /Q1 Cost/ });
    await expect(detailLink).toHaveAttribute("href", "/reports/r1");
  },
};

export const Skeleton: Story = {
  args: { isPending: true, reports: [] },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  },
};

export const Empty: Story = {
  args: { reports: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/No reports yet/)).toBeInTheDocument();
  },
};
