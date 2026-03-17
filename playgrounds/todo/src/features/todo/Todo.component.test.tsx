import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TodoComponent } from "./Todo.component";

const baseProps = {
  todos: [
    { id: "1", title: "Test todo", completed: false },
    { id: "2", title: "Done todo", completed: true },
  ],
  loading: false,
  error: null,
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
  newTitle: "",
  setNewTitle: vi.fn(),
  handleSubmit: vi.fn(),
};

describe("TodoComponent", () => {
  it("renders todos", () => {
    render(<TodoComponent {...baseProps} />);
    expect(screen.getByText("Test todo")).toBeInTheDocument();
    expect(screen.getByText("Done todo")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<TodoComponent {...baseProps} loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <TodoComponent {...baseProps} error={new Error("Network error")} />,
    );
    expect(screen.getByText("Error: Network error")).toBeInTheDocument();
  });

  it("calls toggleTodo when checkbox clicked", async () => {
    const toggleTodo = vi.fn();
    const user = userEvent.setup();
    render(<TodoComponent {...baseProps} toggleTodo={toggleTodo} />);
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(toggleTodo).toHaveBeenCalledWith("1", true);
  });

  it("calls deleteTodo when delete button clicked", async () => {
    const deleteTodo = vi.fn();
    const user = userEvent.setup();
    render(<TodoComponent {...baseProps} deleteTodo={deleteTodo} />);
    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);
    expect(deleteTodo).toHaveBeenCalledWith("1");
  });

  it("calls handleSubmit on form submit", async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TodoComponent {...baseProps} handleSubmit={handleSubmit} />);
    const button = screen.getByText("Add");
    await user.click(button);
    expect(handleSubmit).toHaveBeenCalled();
  });
});
