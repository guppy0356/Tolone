import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
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

export const Default: Story = {
  args: {
    todos: [
      { id: "1", title: "Learn React", completed: false },
      { id: "2", title: "Build app", completed: true },
    ],
  },
};

export const Empty: Story = {
  args: {
    todos: [],
  },
};

export const Skeleton: StoryObj = {
  render: () => <TodoSkeleton />,
};
