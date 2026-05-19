import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { FamilyTodoForm } from "./FamilyTodoForm.component";

const meta = {
  title: "features/FamilyTodoForm",
  component: FamilyTodoForm,
  args: {
    addTodo: fn(),
  },
} satisfies Meta<typeof FamilyTodoForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SubmitsNewTodo: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("What needs to be done?");
    await userEvent.type(input, "New task");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(args.addTodo).toHaveBeenCalledWith({ title: "New task" });
  },
};

export const DoesNotSubmitEmpty: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(args.addTodo).not.toHaveBeenCalled();
  },
};

export const ClearsInputAfterSubmit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(
      "What needs to be done?",
    ) as HTMLInputElement;
    await userEvent.type(input, "New task");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(input).toHaveValue("");
  },
};
