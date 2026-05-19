import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { FamilyTodoList } from "./FamilyTodoList.component";

const sampleTodos = [
  { id: "1", title: "Buy groceries", completed: false, owner: "Mama" as const },
  { id: "2", title: "Fix bicycle", completed: false, owner: "Papa" as const },
  { id: "3", title: "Do homework", completed: true, owner: "Taro" as const },
];

const meta = {
  title: "features/FamilyTodoList",
  component: FamilyTodoList,
  args: {
    todos: sampleTodos,
    currentUser: "Papa",
    isFetching: false,
    toggleTodo: fn(),
    deleteTodo: fn(),
  },
} satisfies Meta<typeof FamilyTodoList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Buy groceries")).toBeInTheDocument();
    await expect(canvas.getByText("Fix bicycle")).toBeInTheDocument();
    await expect(canvas.getByText("Do homework")).toBeInTheDocument();
    await expect(canvas.getByText("Mama")).toBeInTheDocument();
    await expect(canvas.getByText("Papa")).toBeInTheDocument();
    await expect(canvas.getByText("Taro")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { todos: [] },
};

export const OwnTodoCheckboxesOnlyEnabled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkboxes = canvas.getAllByRole("checkbox", { name: /Toggle/ });
    await expect(checkboxes[0]).toBeDisabled();
    await expect(checkboxes[1]).toBeEnabled();
    await expect(checkboxes[2]).toBeDisabled();
  },
};

export const ShowsDeleteButtonOnlyForOwn: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const deleteButtons = canvas.getAllByRole("button", { name: /Delete/ });
    await expect(deleteButtons).toHaveLength(1);
    await expect(deleteButtons[0]).toHaveAccessibleName("Delete Fix bicycle");
  },
};

export const TogglesOwnTodo: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Toggle Fix bicycle" }),
    );
    await expect(args.toggleTodo).toHaveBeenCalledWith("2", true);
  },
};

export const DeletesOwnTodo: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Delete Fix bicycle" }),
    );
    await expect(args.deleteTodo).toHaveBeenCalledWith("2");
  },
};

export const FetchingOpacity: Story = {
  args: { isFetching: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("ul")).toHaveClass("opacity-50");
  },
};
