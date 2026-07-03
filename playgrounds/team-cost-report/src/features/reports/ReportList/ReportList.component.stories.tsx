import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReportListComponent } from "./ReportList.component";
import type { ReportSummary } from "@api/Report.api";

const baseReports: ReportSummary[] = [
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
    isRefetching: false,
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

export const Default: Story = {};

export const Empty: Story = {
  args: { reports: [] },
};

export const Loading: Story = {
  args: { isPending: true, reports: [] },
};

export const LongText: Story = {
  args: {
    reports: [
      {
        id: "r1",
        name: "Consolidated infrastructure and platform cost report for the global engineering organization, FY2026 first quarter",
        teamIds: ["t1", "t2", "t3", "t4", "t5", "t6"],
        createdAt: "2026-04-01T00:00:00Z",
      },
      baseReports[1],
    ],
  },
};
