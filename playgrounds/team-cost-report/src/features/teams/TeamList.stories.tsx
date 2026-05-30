import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { TeamListComponent } from "./TeamList.component";

const meta = {
  title: "features/TeamList",
  component: TeamListComponent,
  args: {
    teams: [
      {
        id: "t1",
        name: "Platform",
        members: [
          { memberId: "m1", name: "Ada", hourlyRate: 120 },
          { memberId: "m2", name: "Alan", hourlyRate: 110 },
        ],
      },
    ],
    isPending: false,
    isFetching: false,
  },
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
      const newRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/teams/new",
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([newRoute]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof TeamListComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Platform")).toBeInTheDocument();
    await expect(canvas.getByText(/2 members/)).toBeInTheDocument();
    await expect(canvas.getByText(/Ada \(\$120\/h\)/)).toBeInTheDocument();
  },
};

export const Skeleton: Story = {
  args: { isPending: true, teams: [] },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  },
};

export const Empty: Story = {
  args: { teams: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/No teams yet/)).toBeInTheDocument();
  },
};
