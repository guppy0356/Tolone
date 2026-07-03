import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReportFormComponent } from "./ReportForm.component";
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

const meta = {
  title: "features/ReportForm",
  component: ReportFormComponent,
  args: {
    teams: sampleTeams,
    isPending: false,
    addReport: fn(),
  },
  // The Component calls useNavigate, so stories mount it inside a minimal
  // router whose root renders the story; the detail route exists only as a
  // navigation target.
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
      const detailRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/reports/$reportId",
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([detailRoute]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof ReportFormComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

// Validation-error and submitting states live in react-hook-form's internal
// state, not in args, so they are covered by the behavior tests instead.
export const Default: Story = {};

export const Empty: Story = { args: { teams: [] } };

export const TeamsLoading: Story = { args: { teams: [], isPending: true } };

export const LongTeamName: Story = {
  args: {
    teams: [
      {
        ...sampleTeams[0],
        name: "Platform Reliability and Infrastructure Engineering Guild",
      },
      sampleTeams[1],
    ],
  },
};
