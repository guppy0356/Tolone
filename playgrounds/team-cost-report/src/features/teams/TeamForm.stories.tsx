import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { TeamFormComponent } from "./TeamForm.component";

const meta = {
  title: "features/TeamForm",
  component: TeamFormComponent,
  args: {
    addTeam: fn(),
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const rootRoute = createRootRoute({
        component: () => (
          <QueryClientProvider client={queryClient}>
            <Story />
          </QueryClientProvider>
        ),
      });
      const teamsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/teams",
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([teamsRoute]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof TeamFormComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SaveDisabledUntilValid: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const save = canvas.getByRole("button", { name: /Save team/ });
    await expect(save).toBeDisabled();

    await userEvent.type(canvas.getByLabelText(/Team name/), "Platform");
    await expect(save).toBeDisabled();

    await userEvent.click(canvas.getByRole("button", { name: /Add member/ }));
    await waitFor(async () => {
      await expect(canvas.getByText("Ada Lovelace")).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByText("Ada Lovelace"));
    await expect(save).toBeDisabled();

    await fireEvent.change(canvas.getByLabelText("Hourly rate for Ada Lovelace"), {
      target: { value: "120" },
    });
    await expect(save).not.toBeDisabled();
  },
};

export const SubmitsCreateTeamInput: Story = {
  args: {
    addTeam: fn(() => Promise.resolve(undefined)),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/Team name/), "Platform");
    await userEvent.click(canvas.getByRole("button", { name: /Add member/ }));
    await waitFor(async () => {
      await expect(canvas.getByText("Ada Lovelace")).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByText("Ada Lovelace"));
    await fireEvent.change(canvas.getByLabelText("Hourly rate for Ada Lovelace"), {
      target: { value: "120" },
    });
    await userEvent.click(canvas.getByRole("button", { name: /Save team/ }));
    await waitFor(async () => {
      await expect(args.addTeam).toHaveBeenCalledWith({
        name: "Platform",
        members: [{ memberId: "m1", hourlyRate: 120 }],
      });
    });
  },
};
