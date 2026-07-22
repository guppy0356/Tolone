import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ApprovalComponent } from "./Approval.component";
import type {
  TravelRequest,
  TravelRequestDetail,
} from "@api/TravelRequest.api";

const sampleRequests: TravelRequest[] = [
  {
    id: "tr-1",
    purpose: "Client visit in Osaka",
    startDate: "2026-07-01",
    endDate: "2026-07-02",
    totalAmount: 45800,
    status: "pending",
    approvalCount: 1,
  },
  {
    id: "tr-2",
    purpose: "Tech conference in Fukuoka",
    startDate: "2026-07-15",
    endDate: "2026-07-17",
    totalAmount: 128400,
    status: "pending",
    approvalCount: 0,
  },
  {
    id: "tr-3",
    purpose: "Factory audit in Nagoya",
    startDate: "2026-06-20",
    endDate: "2026-06-20",
    totalAmount: 21300,
    status: "completed",
    approvalCount: 2,
  },
  {
    id: "tr-4",
    purpose: "Sales kickoff in Sapporo",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    totalAmount: 98000,
    status: "rejected",
    approvalCount: 0,
  },
];

const sampleDetail: TravelRequestDetail = {
  ...sampleRequests[0],
  items: [
    { id: "i-1", label: "Shinkansen (round trip)", amount: 29000 },
    { id: "i-2", label: "Hotel (1 night)", amount: 12000 },
    { id: "i-3", label: "Per diem", amount: 4800 },
  ],
};

const meta = {
  title: "features/Approval",
  component: ApprovalComponent,
  args: {
    requests: [],
    isRequestsPending: false,
    isRequestsRefetching: false,
    selectedRequestId: null,
    selectRequest: fn(),
    detail: undefined,
    isDetailPending: false,
    superiors: [],
    isSuperiorsPending: false,
    approve: fn(),
    reject: fn(),
  },
} satisfies Meta<typeof ApprovalComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { requests: sampleRequests } };

export const Empty: Story = { args: { requests: [] } };

export const Loading: Story = { args: { isRequestsPending: true } };

export const DetailOpen: Story = {
  args: {
    requests: sampleRequests,
    selectedRequestId: "tr-1",
    detail: sampleDetail,
  },
};

export const DetailLoading: Story = {
  args: {
    requests: sampleRequests,
    selectedRequestId: "tr-1",
    detail: undefined,
    isDetailPending: true,
  },
};

export const LongPurpose: Story = {
  args: {
    requests: [
      {
        ...sampleRequests[0],
        purpose:
          "Quarterly on-site alignment with the Osaka client covering the renewal negotiation, the phase-two rollout plan, and the joint engineering workshop",
      },
    ],
  },
};
