import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TodoComponent } from "./Todo.component";
import type { TodoFacade } from "./Todo.facade";

const baseFacade: TodoFacade = {
  todos: [
    { id: "1", title: "Test todo", completed: false },
    { id: "2", title: "Done todo", completed: true },
  ],
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
};

describe("TodoComponent", () => {
  it("renders todos", () => {
    render(<TodoComponent {...baseFacade} />);
    expect(screen.getByText("Test todo")).toBeInTheDocument();
    expect(screen.getByText("Done todo")).toBeInTheDocument();
  });

  it("calls toggleTodo when checkbox clicked", async () => {
    const toggleTodo = vi.fn();
    const user = userEvent.setup();
    render(<TodoComponent {...baseFacade} toggleTodo={toggleTodo} />);
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(toggleTodo).toHaveBeenCalledWith("1", true);
  });

  it("calls deleteTodo when delete button clicked", async () => {
    const deleteTodo = vi.fn();
    const user = userEvent.setup();
    render(<TodoComponent {...baseFacade} deleteTodo={deleteTodo} />);
    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);
    expect(deleteTodo).toHaveBeenCalledWith("1");
  });

  it("submits new todo via form", async () => {
    const addTodo = vi.fn();
    const user = userEvent.setup();
    render(<TodoComponent {...baseFacade} addTodo={addTodo} />);
    const input = screen.getByPlaceholderText("What needs to be done?");
    await user.type(input, "New todo");
    await user.click(screen.getByText("Add"));
    expect(addTodo).toHaveBeenCalledWith({ title: "New todo" });
  });
});
