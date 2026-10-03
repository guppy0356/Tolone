import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ApplicationRouterHarness } from "../../../test/application-router";
import { ApplicationListComponent } from "./ApplicationList.component";

const sampleApplications = [
  { id: "1", companyName: "Acme", position: "Frontend Engineer", status: "interviewing" as const, appliedAt: "2026-09-01" },
  { id: "2", companyName: "Globex", position: "Product Engineer", status: "applied" as const, appliedAt: "2026-09-12" },
  { id: "3", companyName: "Initech", position: "Staff Engineer", status: "rejected" as const, appliedAt: "2026-08-20" },
];

const meta = {
  title: "features/ApplicationList",
  component: ApplicationListComponent,
  decorators: [
    (Story) => (
      <ApplicationRouterHarness>
        <Story />
      </ApplicationRouterHarness>
    ),
  ],
  args: {
    applications: [],
    total: 0,
    pageSize: 10,
    isPending: false,
    isRefetching: false,
    updateStatus: fn(),
    deleteApplication: fn(),
    search: { status: [], sort: "-appliedAt", page: 1 },
  },
} satisfies Meta<typeof ApplicationListComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { applications: sampleApplications, total: 3 } };
export const Empty: Story = {};
export const Loading: Story = { args: { isPending: true } };
export const Refetching: Story = {
  args: { applications: sampleApplications, total: 3, isRefetching: true },
};
export const Paged: Story = {
  args: {
    applications: sampleApplications,
    total: 23,
    search: { status: ["applied", "interviewing"], sort: "company", page: 2 },
  },
};
export const LongText: Story = {
  args: {
    applications: [
      { id: "1", companyName: "Acme ".repeat(20), position: "Senior Staff Principal Distinguished Engineer ".repeat(4), status: "offer", appliedAt: "2026-09-01" },
    ],
    total: 1,
  },
};
