import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FamilyTodoFilter } from "./FamilyTodoFilter.component";
import type { FamilyTodoFilterProps } from "./FamilyTodoFilter.presenter";

const baseProps: FamilyTodoFilterProps = {
  selectedMembers: [],
  filterTodos: vi.fn(),
};

describe("FamilyTodoFilter", () => {
  it("calls filterTodos with added member when selecting", async () => {
    const filterTodos = vi.fn();
    const user = userEvent.setup();
    render(<FamilyTodoFilter {...baseProps} filterTodos={filterTodos} />);
    await user.click(screen.getByRole("combobox", { name: "Filter by member" }));
    await user.click(screen.getByRole("button", { name: /Mama/ }));
    expect(filterTodos).toHaveBeenCalledWith(["Mama"]);
  });

  it("calls filterTodos with removed member when deselecting", async () => {
    const filterTodos = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoFilter
        selectedMembers={["Mama", "Taro"]}
        filterTodos={filterTodos}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Filter by member" }));
    // Click the dropdown option, not the chip remove button
    const options = screen.getAllByRole("button", { name: /Mama/ });
    await user.click(options[options.length - 1]);
    expect(filterTodos).toHaveBeenCalledWith(["Taro"]);
  });

  it("shows chips for selected members", () => {
    render(
      <FamilyTodoFilter {...baseProps} selectedMembers={["Mama", "Taro"]} />,
    );
    expect(screen.getByRole("button", { name: "Remove Mama" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Taro" })).toBeInTheDocument();
  });

  it("calls filterTodos with member removed when clicking chip remove button", async () => {
    const filterTodos = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoFilter
        selectedMembers={["Mama"]}
        filterTodos={filterTodos}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove Mama" }));
    expect(filterTodos).toHaveBeenCalledWith([]);
  });

  it("shows 'All members' when nothing is selected", () => {
    render(<FamilyTodoFilter {...baseProps} />);
    expect(screen.getByText("All members")).toBeInTheDocument();
  });
});
