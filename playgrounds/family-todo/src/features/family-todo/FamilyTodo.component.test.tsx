import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FamilyTodoComponent } from "./FamilyTodo.component";
import type { FamilyTodoFacade } from "./FamilyTodo.facade";

const baseFacade: FamilyTodoFacade = {
  todos: [
    { id: "1", title: "Buy groceries", completed: false, owner: "Mama" },
    { id: "2", title: "Fix bicycle", completed: false, owner: "Papa" },
    { id: "3", title: "Do homework", completed: true, owner: "Taro" },
  ],
  currentUser: "Papa",
  setCurrentUser: vi.fn(),
  selectedMembers: [],
  toggleMemberSelection: vi.fn(),
  removeMember: vi.fn(),
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
};

describe("FamilyTodoComponent", () => {
  it("renders all family todos with owner names", () => {
    render(<FamilyTodoComponent {...baseFacade} />);
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Fix bicycle")).toBeInTheDocument();
    expect(screen.getByText("Do homework")).toBeInTheDocument();
    expect(screen.getByText("Mama")).toBeInTheDocument();
    expect(screen.getByText("Papa")).toBeInTheDocument();
    expect(screen.getByText("Taro")).toBeInTheDocument();
  });

  it("enables checkbox only for own todos", () => {
    render(<FamilyTodoComponent {...baseFacade} />);
    const checkboxes = screen.getAllByRole("checkbox", { name: /Toggle/ });
    // Mama's todo — not own (current user is Papa) — disabled
    expect(checkboxes[0]).toBeDisabled();
    // Papa's todo — own — enabled
    expect(checkboxes[1]).toBeEnabled();
    // Taro's todo — not own — disabled
    expect(checkboxes[2]).toBeDisabled();
  });

  it("shows delete button only for own todos", () => {
    render(<FamilyTodoComponent {...baseFacade} />);
    const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
    // Only Papa's todo should have a delete button
    expect(deleteButtons).toHaveLength(1);
    expect(deleteButtons[0]).toHaveAccessibleName("Delete Fix bicycle");
  });

  it("toggles own todo", async () => {
    const toggleTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoComponent {...baseFacade} toggleTodo={toggleTodo} />);
    const papaCheckbox = screen.getByRole("checkbox", {
      name: "Toggle Fix bicycle",
    });
    await user.click(papaCheckbox);
    expect(toggleTodo).toHaveBeenCalledWith("2", true);
  });

  it("deletes own todo", async () => {
    const deleteTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoComponent {...baseFacade} deleteTodo={deleteTodo} />);
    await user.click(screen.getByRole("button", { name: "Delete Fix bicycle" }));
    expect(deleteTodo).toHaveBeenCalledWith("2");
  });

  it("submits new todo as current user", async () => {
    const addTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoComponent {...baseFacade} addTodo={addTodo} />);
    const input = screen.getByPlaceholderText("What needs to be done?");
    await user.type(input, "New task");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(addTodo).toHaveBeenCalledWith({ title: "New task", owner: "Papa" });
  });

  it("does not submit empty todo", async () => {
    const addTodo = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoComponent {...baseFacade} addTodo={addTodo} />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(addTodo).not.toHaveBeenCalled();
  });

  it("calls toggleMemberSelection when selecting a member", async () => {
    const toggleMemberSelection = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoComponent
        {...baseFacade}
        toggleMemberSelection={toggleMemberSelection}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Filter by member" }));
    await user.click(screen.getByRole("button", { name: /Mama/ }));
    expect(toggleMemberSelection).toHaveBeenCalledWith("Mama");
  });

  it("shows chips for selected members", () => {
    render(
      <FamilyTodoComponent
        {...baseFacade}
        selectedMembers={["Mama", "Taro"]}
      />,
    );
    expect(screen.getByRole("button", { name: "Remove Mama" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Taro" })).toBeInTheDocument();
  });

  it("calls removeMember when clicking chip remove button", async () => {
    const removeMember = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoComponent
        {...baseFacade}
        selectedMembers={["Mama"]}
        removeMember={removeMember}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove Mama" }));
    expect(removeMember).toHaveBeenCalledWith("Mama");
  });

  it("switches current user", async () => {
    const setCurrentUser = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoComponent {...baseFacade} setCurrentUser={setCurrentUser} />,
    );
    await user.selectOptions(screen.getByLabelText("Current user"), "Mama");
    expect(setCurrentUser).toHaveBeenCalledWith("Mama");
  });
});
