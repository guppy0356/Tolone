import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FamilyTodoForm } from "./FamilyTodoForm.component";
import type { FamilyTodoFormProps } from "./FamilyTodoForm.presenter";

const baseProps: FamilyTodoFormProps = {
  addTodo: vi.fn(),
};

describe("FamilyTodoForm", () => {
  it("submits new todo with title only", async () => {
    const addTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoForm {...baseProps} addTodo={addTodo} />);
    const input = screen.getByPlaceholderText("What needs to be done?");
    await user.type(input, "New task");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(addTodo).toHaveBeenCalledWith({ title: "New task" });
  });

  it("does not submit empty todo", async () => {
    const addTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoForm {...baseProps} addTodo={addTodo} />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(addTodo).not.toHaveBeenCalled();
  });

  it("clears input after submit", async () => {
    const addTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoForm {...baseProps} addTodo={addTodo} />);
    const input = screen.getByPlaceholderText("What needs to be done?");
    await user.type(input, "New task");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(input).toHaveValue("");
  });
});
