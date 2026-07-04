import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { Member } from "@api/Member.api";
import { TeamFormComponent } from "./TeamForm.component";

const sampleMembers: Member[] = [
  { id: "m1", name: "Ada Lovelace" },
  { id: "m2", name: "Alan Turing" },
  { id: "m3", name: "Grace Hopper" },
];

const meta = {
  title: "features/TeamForm",
  component: TeamFormComponent,
  args: {
    addTeam: fn(),
    memberSearch: "",
    setMemberSearch: fn(),
    members: sampleMembers,
    isFetching: false,
  },
  // The Component calls useNavigate, so stories mount it inside a minimal
  // router whose root renders the story; the teams route exists only as a
  // navigation target.
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
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

// The picker (candidates, searching state) sits behind component-hook open
// state and validation/submitting live in react-hook-form's internals, so
// none of them can be pinned through args — they are asserted in the
// behavior tests instead.
export const Default: Story = {};
