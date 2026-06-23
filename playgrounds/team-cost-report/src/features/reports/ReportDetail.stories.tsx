import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ReportDetailComponent } from "./ReportDetail.component";
import type { ReportDetailFacade } from "./ReportDetail.facade";

const baseDetail: NonNullable<ReportDetailFacade["detail"]> = {
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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Q1 2026 Cost")).toBeInTheDocument();
    await expect(canvas.getByText("$12,345")).toBeInTheDocument();
    // Recharts legend duplicates team names in the DOM (real layout in Chromium).
    await expect(canvas.getAllByText("Platform").length).toBeGreaterThan(0);
    await expect(canvas.getAllByText("Mobile").length).toBeGreaterThan(0);
  },
};

export const Skeleton: Story = {
  args: { isPending: true, detail: undefined },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  },
};

export const NotFound: Story = {
  args: { isNotFound: true, detail: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Report not found/)).toBeInTheDocument();
  },
};

export const EmptyData: Story = {
  args: {
    detail: { ...baseDetail, monthly: [], teams: [] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/No data to display/)).toBeInTheDocument();
  },
};
