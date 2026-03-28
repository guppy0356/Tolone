import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FamilyTodoList } from "./FamilyTodoList.component";
import type { FamilyTodoListProps } from "./FamilyTodoList.presenter";

const baseProps: FamilyTodoListProps = {
  todos: [
    { id: "1", title: "Buy groceries", completed: false, owner: "Mama" },
    { id: "2", title: "Fix bicycle", completed: false, owner: "Papa" },
    { id: "3", title: "Do homework", completed: true, owner: "Taro" },
  ],
  currentUser: "Papa",
  isFetching: false,
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
};

describe("FamilyTodoList", () => {
  it("renders all todos with owner names", () => {
    render(<FamilyTodoList {...baseProps} />);
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Fix bicycle")).toBeInTheDocument();
    expect(screen.getByText("Do homework")).toBeInTheDocument();
    expect(screen.getByText("Mama")).toBeInTheDocument();
    expect(screen.getByText("Papa")).toBeInTheDocument();
    expect(screen.getByText("Taro")).toBeInTheDocument();
  });

  it("enables checkbox only for own todos", () => {
    render(<FamilyTodoList {...baseProps} />);
    const checkboxes = screen.getAllByRole("checkbox", { name: /Toggle/ });
    expect(checkboxes[0]).toBeDisabled(); // Mama's
    expect(checkboxes[1]).toBeEnabled(); // Papa's (own)
    expect(checkboxes[2]).toBeDisabled(); // Taro's
  });

  it("shows delete button only for own todos", () => {
    render(<FamilyTodoList {...baseProps} />);
    const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
    expect(deleteButtons).toHaveLength(1);
    expect(deleteButtons[0]).toHaveAccessibleName("Delete Fix bicycle");
  });

  it("toggles own todo", async () => {
    const toggleTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoList {...baseProps} toggleTodo={toggleTodo} />);
    await user.click(
      screen.getByRole("checkbox", { name: "Toggle Fix bicycle" }),
    );
    expect(toggleTodo).toHaveBeenCalledWith("2", true);
  });

  it("deletes own todo", async () => {
    const deleteTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoList {...baseProps} deleteTodo={deleteTodo} />);
    await user.click(screen.getByRole("button", { name: "Delete Fix bicycle" }));
    expect(deleteTodo).toHaveBeenCalledWith("2");
  });

  it("applies opacity when isFetching", () => {
    const { container } = render(
      <FamilyTodoList {...baseProps} isFetching={true} />,
    );
    expect(container.querySelector("ul")).toHaveClass("opacity-50");
  });
});
