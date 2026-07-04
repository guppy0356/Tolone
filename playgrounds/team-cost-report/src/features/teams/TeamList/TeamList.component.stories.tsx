import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { TeamListComponent } from "./TeamList.component";
import type { Team } from "@api/Team.api";

const baseTeams: Team[] = [
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
    name: "Design",
    members: [{ memberId: "m3", name: "Grace", hourlyRate: 95 }],
  },
];

const meta = {
  title: "features/TeamList",
  component: TeamListComponent,
  args: {
    teams: baseTeams,
    isPending: false,
    isRefetching: false,
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

export const Default: Story = {};

export const Empty: Story = {
  args: { teams: [] },
};

export const Loading: Story = {
  args: { isPending: true, teams: [] },
};

export const NoMembers: Story = {
  args: {
    teams: [{ id: "t1", name: "Platform", members: [] }],
  },
};

export const LongText: Story = {
  args: {
    teams: [
      {
        id: "t1",
        name: "Global Platform Engineering and Infrastructure Reliability Team, EMEA and APAC regions combined",
        members: Array.from({ length: 12 }, (_, i) => ({
          memberId: `m${i + 1}`,
          name: `Member With A Rather Long Name ${i + 1}`,
          hourlyRate: 100 + i,
        })),
      },
      baseTeams[1],
    ],
  },
};
