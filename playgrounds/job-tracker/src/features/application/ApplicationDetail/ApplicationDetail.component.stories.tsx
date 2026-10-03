import type { Meta, StoryObj } from "@storybook/react-vite";
import { ApplicationRouterHarness } from "../../../test/application-router";
import { ApplicationDetailComponent } from "./ApplicationDetail.component";

const detail = {
  id: "1",
  companyId: "c1",
  companyName: "Acme",
  position: "Frontend Engineer",
  status: "interviewing" as const,
  appliedAt: "2026-09-01",
  salary: "¥9,000,000 – ¥11,000,000",
  notes: "Referred by Sam.\nTake-home due next Friday.",
};

const interviews = [
  { id: "i1", kind: "phone" as const, scheduledAt: "2026-09-08T09:30:00Z", interviewer: "Dana" },
  { id: "i2", kind: "video" as const, scheduledAt: "2026-10-14T10:00:00Z", interviewer: "Lee" },
];

const meta = {
  title: "features/ApplicationDetail",
  component: ApplicationDetailComponent,
  decorators: [
    (Story, { parameters }) => (
      <ApplicationRouterHarness initialUrl={parameters.initialUrl ?? "/applications/1"}>
        <Story />
      </ApplicationRouterHarness>
    ),
  ],
  args: {
    detail,
    interviews: [],
    isDetailPending: false,
    isDetailRefetching: false,
    isInterviewsLoading: false,
    isNotFound: false,
    search: { tab: "overview" },
  },
} satisfies Meta<typeof ApplicationDetailComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoSalaryNoNotes: Story = {
  args: { detail: { ...detail, salary: undefined, notes: "" } },
};
export const Interviews: Story = {
  args: { interviews, search: { tab: "interviews" } },
  parameters: { initialUrl: "/applications/1?tab=interviews" },
};
export const InterviewsLoading: Story = {
  args: { isInterviewsLoading: true, search: { tab: "interviews" } },
  parameters: { initialUrl: "/applications/1?tab=interviews" },
};
export const Loading: Story = { args: { detail: undefined, isDetailPending: true } };
export const NotFound: Story = { args: { detail: undefined, isDetailPending: false, isNotFound: true } };
