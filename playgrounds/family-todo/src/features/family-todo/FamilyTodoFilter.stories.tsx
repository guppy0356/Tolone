import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { FamilyTodoFilter } from "./FamilyTodoFilter.component";

const meta = {
  title: "features/FamilyTodoFilter",
  component: FamilyTodoFilter,
  args: {
    selectedMembers: [],
    filterTodos: fn(),
  },
} satisfies Meta<typeof FamilyTodoFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelectedMembers: Story = {
  args: { selectedMembers: ["Mama", "Taro"] },
};

export const SelectsMember: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("combobox", { name: "Filter by member" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: /Mama/ }));
    await expect(args.filterTodos).toHaveBeenCalledWith(["Mama"]);
  },
};

export const DeselectsMember: Story = {
  args: { selectedMembers: ["Mama", "Taro"] },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("combobox", { name: "Filter by member" }),
    );
    const options = canvas.getAllByRole("button", { name: /Mama/ });
    await userEvent.click(options[options.length - 1]);
    await expect(args.filterTodos).toHaveBeenCalledWith(["Taro"]);
  },
};

export const ShowsChips: Story = {
  args: { selectedMembers: ["Mama", "Taro"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Remove Mama" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Remove Taro" }),
    ).toBeInTheDocument();
  },
};

export const ChipRemoveCallsFilter: Story = {
  args: { selectedMembers: ["Mama"] },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove Mama" }),
    );
    await expect(args.filterTodos).toHaveBeenCalledWith([]);
  },
};

export const ShowsAllMembersPlaceholder: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("All members")).toBeInTheDocument();
  },
};
