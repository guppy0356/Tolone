import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReportFormComponent } from "./ReportForm.component";
import type { Team } from "../teams/Team.api";

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

export const Default: Story = {};

export const SaveDisabledUntilValid: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole("button", { name: /Save report/ });
    await expect(save).toBeDisabled();

    await userEvent.type(canvas.getByLabelText(/Report name/), "Q2 Cost");
    await expect(save).toBeDisabled();

    await userEvent.click(canvas.getByLabelText(/Platform/));
    await expect(save).not.toBeDisabled();
  },
};

export const SubmitsTeamIds: Story = {
  args: {
    addReport: fn(() =>
      Promise.resolve({
        id: "r-new",
        name: "Q2 Cost",
        teamIds: ["t1", "t2"],
        createdAt: "2026-05-14T00:00:00Z",
      }),
    ),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/Report name/), "Q2 Cost");
    await userEvent.click(canvas.getByLabelText(/Platform/));
    await userEvent.click(canvas.getByLabelText(/Mobile/));
    await userEvent.click(canvas.getByRole("button", { name: /Save report/ }));
    await waitFor(async () => {
      await expect(args.addReport).toHaveBeenCalledWith({
        name: "Q2 Cost",
        teamIds: ["t1", "t2"],
      });
    });
  },
};

export const Empty: Story = {
  args: { teams: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/No teams available/)).toBeInTheDocument();
  },
};

export const TeamsLoading: Story = {
  args: { teams: [], isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvasElement.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
    await expect(canvas.queryByText(/No teams available/)).toBeNull();
  },
};
