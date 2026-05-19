import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { NotificationSettingsComponent } from "./NotificationSettings.component";

const meta = {
  title: "features/NotificationSettings",
  component: NotificationSettingsComponent,
  args: {
    preferences: {
      reviewRequested: true,
      mentioned: true,
      issueAssigned: false,
    },
    isPending: false,
    isFetching: false,
    updatePreference: fn(),
  },
} satisfies Meta<typeof NotificationSettingsComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Review requested")).toBeChecked();
    await expect(canvas.getByLabelText("Mentioned")).toBeChecked();
    await expect(canvas.getByLabelText("Issue assigned")).not.toBeChecked();
  },
};

export const Skeleton: Story = {
  args: { preferences: undefined, isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByLabelText("Loading notifications"),
    ).toBeInTheDocument();
  },
};

export const TogglesOnPreference: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Issue assigned"));
    await expect(args.updatePreference).toHaveBeenCalledWith(
      "issueAssigned",
      true,
    );
  },
};

export const TogglesOffPreference: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Review requested"));
    await expect(args.updatePreference).toHaveBeenCalledWith(
      "reviewRequested",
      false,
    );
  },
};
