import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { membersApi } from "./Members.api";
import type { TeamFormFacade } from "./TeamForm.facade";
import { TeamFormComponent } from "./TeamForm.component";

type HarnessProps = Pick<TeamFormFacade, "addTeam">;

function TeamFormHarness({ addTeam }: HarnessProps) {
  const [memberSearch, setMemberSearch] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: memberSearch ? ["members", { q: memberSearch }] : ["members"],
    queryFn: () => membersApi.getAll(memberSearch || undefined),
    placeholderData: keepPreviousData,
  });
  return (
    <TeamFormComponent
      addTeam={addTeam}
      memberSearch={memberSearch}
      setMemberSearch={setMemberSearch}
      members={data ?? []}
      isFetchingMembers={isFetching}
    />
  );
}

const meta = {
  title: "features/TeamForm",
  component: TeamFormHarness,
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
} satisfies Meta<typeof TeamFormHarness>;

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
