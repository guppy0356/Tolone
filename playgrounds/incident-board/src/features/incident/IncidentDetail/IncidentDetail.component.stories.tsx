import type { Meta, StoryObj } from "@storybook/react-vite";
import { RouterProvider } from "@tanstack/react-router";
import type { IncidentComment, IncidentDetail } from "@api/Incident.api";
import { createIncidentRouter } from "../../../test/incident-router";
import { IncidentDetailComponent } from "./IncidentDetail.component";

const detail: IncidentDetail = {
  id: "1043",
  key: "INC-1043",
  title: "Checkout API returning 502",
  status: "acknowledged",
  severity: "critical",
  assignee: { id: "u1", name: "Alice Chen" },
  openedAt: "2026-07-28T22:14:00Z",
  description:
    "Paging alerted on elevated 5xx from the checkout service. The error budget for the week is being consumed faster than the allowance.",
  timeline: [
    {
      id: "e1",
      at: "2026-07-28T22:14:00Z",
      kind: "opened",
      actor: "alertmanager",
      message: "Alert fired: error rate above threshold for 5 minutes.",
    },
    {
      id: "e2",
      at: "2026-07-28T22:24:00Z",
      kind: "acknowledged",
      actor: "Alice Chen",
      message: "Acknowledged, rolling back the last deploy.",
    },
  ],
};

const comments: IncidentComment[] = [
  {
    id: "c1",
    author: "Alice Chen",
    body: "Correlating with the deploy that went out at the same time.",
    postedAt: "2026-07-28T22:29:00Z",
  },
  {
    id: "c2",
    author: "Bob Ito",
    body: "Support is only seeing reports from the EU region.",
    postedAt: "2026-07-28T22:44:00Z",
  },
];

const meta = {
  title: "features/IncidentDetail",
  component: IncidentDetailComponent,
  decorators: [
    (Story) => (
      <RouterProvider
        router={createIncidentRouter({
          children: <Story />,
          initialUrl: "/incidents/1043",
        })}
      />
    ),
  ],
  args: {
    detail,
    comments: [],
    isDetailPending: false,
    isDetailNotFound: false,
    isCommentsLoading: false,
    search: { status: [], sort: "-openedAt", page: 1, tab: "timeline" },
  },
} satisfies Meta<typeof IncidentDetailComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Timeline: Story = {};

export const Comments: Story = {
  args: {
    comments,
    search: { status: [], sort: "-openedAt", page: 1, tab: "comments" },
  },
};

export const CommentsLoading: Story = {
  args: {
    isCommentsLoading: true,
    search: { status: [], sort: "-openedAt", page: 1, tab: "comments" },
  },
};

export const CommentsEmpty: Story = {
  args: {
    comments: [],
    search: { status: [], sort: "-openedAt", page: 1, tab: "comments" },
  },
};

export const Loading: Story = {
  args: { detail: undefined, isDetailPending: true },
};

export const NotFound: Story = {
  args: { detail: undefined, isDetailNotFound: true },
};

export const ReachedFromAFilteredList: Story = {
  args: {
    search: {
      status: ["open", "acknowledged"],
      severity: "critical",
      assignee: "u1",
      sort: "-severity",
      page: 3,
      tab: "timeline",
    },
  },
};

export const Unassigned: Story = {
  args: {
    detail: {
      ...detail,
      assignee: null,
      title:
        "Payment reconciliation job stalled while replaying the overnight settlement backlog for every merchant in the region",
    },
  },
};
