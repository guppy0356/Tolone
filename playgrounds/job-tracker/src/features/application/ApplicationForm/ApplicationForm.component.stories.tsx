import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { ApplicationRouterHarness } from "../../../test/application-router";
import { ApplicationFormComponent } from "./ApplicationForm.component";

const meta = {
  title: "features/ApplicationForm",
  component: ApplicationFormComponent,
  decorators: [
    (Story) => (
      <ApplicationRouterHarness initialUrl="/applications/new">
        <Story />
      </ApplicationRouterHarness>
    ),
  ],
  args: {
    companies: [],
    companyKeyword: "",
    setCompanyKeyword: fn(),
    isFetching: false,
    addApplication: fn(),
  },
} satisfies Meta<typeof ApplicationFormComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Validation errors, the open picker and the submitting state live in form and
// hook state, not args — they are asserted in the behavior tests instead.
export const Default: Story = {};
