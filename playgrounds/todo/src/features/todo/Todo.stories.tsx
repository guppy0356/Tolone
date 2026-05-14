import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TodoComponent, TodoSkeleton } from "./Todo.component";

const meta = {
  title: "features/Todo",
  component: TodoComponent,
  args: {
    addTodo: fn(),
    toggleTodo: fn(),
    deleteTodo: fn(),
  },
} satisfies Meta<typeof TodoComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleTodos = [
  { id: "1", title: "Test todo", completed: false },
  { id: "2", title: "Done todo", completed: true },
];

export const Default: Story = {
  args: { todos: sampleTodos },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Test todo")).toBeInTheDocument();
    await expect(canvas.getByText("Done todo")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { todos: [] },
};

export const Skeleton: StoryObj = {
  render: () => <TodoSkeleton />,
};

export const TogglesTodo: Story = {
  args: { todos: sampleTodos },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const checkboxes = canvas.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);
    await expect(args.toggleTodo).toHaveBeenCalledWith("1", true);
  },
};

export const DeletesTodo: Story = {
  args: { todos: sampleTodos },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const deleteButtons = canvas.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);
    await expect(args.deleteTodo).toHaveBeenCalledWith("1");
  },
};

export const SubmitsNewTodo: Story = {
  args: { todos: sampleTodos },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("What needs to be done?");
    await userEvent.type(input, "New todo");
    await userEvent.click(canvas.getByText("Add"));
    await expect(args.addTodo).toHaveBeenCalledWith({ title: "New todo" });
  },
};
