import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  within,
} from "storybook/test";
import { TeamMemberList } from "./TeamMemberList.component";

const meta = {
  title: "features/TeamMemberList",
  component: TeamMemberList,
  args: {
    picked: [],
    onRateChange: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof TeamMemberList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Default: Story = {
  args: {
    picked: [
      { memberId: "m1", name: "Ada Lovelace", hourlyRate: 120 },
      { memberId: "m2", name: "Alan Turing", hourlyRate: 0 },
    ],
  },
};

export const ChangesRate: Story = {
  args: {
    picked: [{ memberId: "m1", name: "Ada Lovelace", hourlyRate: 120 }],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const rateInput = canvas.getByLabelText(
      "Hourly rate for Ada Lovelace",
    ) as HTMLInputElement;
    await expect(rateInput).toHaveValue(120);
    await fireEvent.change(rateInput, { target: { value: "150" } });
    await expect(args.onRateChange).toHaveBeenLastCalledWith("m1", 150);
  },
};

export const RemovesMember: Story = {
  args: {
    picked: [{ memberId: "m1", name: "Ada Lovelace", hourlyRate: 120 }],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove Ada Lovelace" }),
    );
    await expect(args.onRemove).toHaveBeenCalledWith("m1");
  },
};
