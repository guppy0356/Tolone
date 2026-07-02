import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReportDetailComponent } from "./ReportDetail.component";
import type { ReportDetailContainerState } from "./ReportDetail.container.hook";

const baseDetail: NonNullable<ReportDetailContainerState["detail"]> = {
  id: "r1",
  name: "Q1 2026 Cost",
  teams: [
    {
      id: "t1",
      name: "Platform",
      members: [{ memberId: "m1", name: "Ada", hourlyRate: 120 }],
    },
    {
      id: "t2",
      name: "Mobile",
      members: [{ memberId: "m3", name: "Grace", hourlyRate: 105 }],
    },
  ],
  totalPayment: 12345,
  monthly: [
    {
      month: "2026-01",
      payments: [
        { teamId: "t1", amount: 5000 },
        { teamId: "t2", amount: 3000 },
      ],
    },
    {
      month: "2026-02",
      payments: [
        { teamId: "t1", amount: 2500 },
        { teamId: "t2", amount: 1845 },
      ],
    },
  ],
};

const meta = {
  title: "features/ReportDetail",
  component: ReportDetailComponent,
  args: {
    detail: baseDetail,
    isPending: false,
    isRefetching: false,
    isNotFound: false,
  },
} satisfies Meta<typeof ReportDetailComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyData: Story = {
  args: { detail: { ...baseDetail, monthly: [], teams: [] } },
};

export const Skeleton: Story = {
  args: { isPending: true, detail: undefined },
};

export const NotFound: Story = {
  args: { isNotFound: true, detail: undefined },
};

export const LongText: Story = {
  args: {
    detail: {
      ...baseDetail,
      name: "Consolidated infrastructure and platform cost report for the global engineering organization, FY2026 first quarter",
      teams: [
        {
          ...baseDetail.teams[0],
          name: "Platform Reliability and Infrastructure Engineering",
        },
        baseDetail.teams[1],
      ],
    },
  },
};
