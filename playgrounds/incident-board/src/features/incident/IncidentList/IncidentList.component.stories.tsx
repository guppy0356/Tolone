import type { Meta, StoryObj } from "@storybook/react-vite";
import { RouterProvider } from "@tanstack/react-router";
import type { IncidentSummary } from "@api/Incident.api";
import type { User } from "@api/User.api";
import { createIncidentRouter } from "../../../test/incident-router";
import { IncidentListComponent } from "./IncidentList.component";

const alice: User = { id: "u1", name: "Alice Chen" };
const bob: User = { id: "u2", name: "Bob Ito" };

const incidents: IncidentSummary[] = [
  {
    id: "1",
    key: "INC-1043",
    title: "Checkout API returning 502",
    status: "open",
    severity: "critical",
    assignee: alice,
    openedAt: "2026-07-28T22:14:00Z",
  },
  {
    id: "2",
    key: "INC-1042",
    title: "Search latency above 2s",
    status: "acknowledged",
    severity: "high",
    assignee: bob,
    openedAt: "2026-07-28T09:03:00Z",
  },
  {
    id: "3",
    key: "INC-1039",
    title: "Nightly backup skipped",
    status: "resolved",
    severity: "low",
    assignee: null,
    openedAt: "2026-07-26T02:00:00Z",
  },
];

const meta = {
  title: "features/IncidentList",
  component: IncidentListComponent,
  decorators: [
    (Story) => (
      <RouterProvider router={createIncidentRouter({ children: <Story /> })} />
    ),
  ],
  args: {
    incidents,
    total: incidents.length,
    totalPages: 1,
    assignees: [alice, bob],
    isIncidentsPending: false,
    isIncidentsRefetching: false,
    isAssigneesPending: false,
    search: { status: [], sort: "-openedAt", page: 1 },
  },
} satisfies Meta<typeof IncidentListComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filtered: Story = {
  args: {
    incidents: [incidents[0]],
    total: 1,
    search: {
      status: ["open"],
      severity: "critical",
      assignee: "u1",
      sort: "-openedAt",
      page: 1,
    },
  },
};

export const Empty: Story = {
  args: { incidents: [], total: 0, totalPages: 0 },
};

export const Loading: Story = {
  args: { incidents: [], isIncidentsPending: true },
};

export const Refetching: Story = {
  args: { isIncidentsRefetching: true },
};

export const AssigneesStillLoading: Story = {
  args: { assignees: [], isAssigneesPending: true },
};

export const DeepInPagination: Story = {
  args: {
    total: 128,
    totalPages: 7,
    search: { status: [], sort: "-openedAt", page: 4 },
  },
};

export const LongText: Story = {
  args: {
    incidents: [
      {
        ...incidents[0],
        title:
          "Payment reconciliation job stalled while replaying the overnight settlement backlog ".repeat(
            3,
          ),
      },
    ],
    total: 1,
  },
};
