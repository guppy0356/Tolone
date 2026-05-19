import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SettingsTabsNav } from "./SettingsTabs.component";

const meta = {
  title: "features/SettingsTabsNav",
  component: SettingsTabsNav,
  args: {
    activeTab: "profile",
    onTabChange: fn(),
  },
} satisfies Meta<typeof SettingsTabsNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("tab", { name: "Profile" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      canvas.getByRole("tab", { name: "Notifications" }),
    ).toHaveAttribute("aria-selected", "false");
  },
};

export const ChangesTab: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Notifications" }));
    await expect(args.onTabChange).toHaveBeenCalledWith("notifications");
  },
};
