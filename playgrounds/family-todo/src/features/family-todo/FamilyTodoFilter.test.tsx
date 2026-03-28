import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FamilyTodoFilter } from "./FamilyTodoFilter.component";
import type { FamilyTodoFilterProps } from "./FamilyTodoFilter.presenter";

const baseProps: FamilyTodoFilterProps = {
  selectedMembers: [],
  toggleMemberSelection: vi.fn(),
  removeMember: vi.fn(),
};

describe("FamilyTodoFilter", () => {
  it("calls toggleMemberSelection when selecting a member", async () => {
    const toggleMemberSelection = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoFilter
        {...baseProps}
        toggleMemberSelection={toggleMemberSelection}
      />,
    );
    await user.click(screen.getByRole("combobox", { name: "Filter by member" }));
    await user.click(screen.getByRole("button", { name: /Mama/ }));
    expect(toggleMemberSelection).toHaveBeenCalledWith("Mama");
  });

  it("shows chips for selected members", () => {
    render(
      <FamilyTodoFilter {...baseProps} selectedMembers={["Mama", "Taro"]} />,
    );
    expect(screen.getByRole("button", { name: "Remove Mama" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Taro" })).toBeInTheDocument();
  });

  it("calls removeMember when clicking chip remove button", async () => {
    const removeMember = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoFilter
        {...baseProps}
        selectedMembers={["Mama"]}
        removeMember={removeMember}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove Mama" }));
    expect(removeMember).toHaveBeenCalledWith("Mama");
  });

  it("shows 'All members' when nothing is selected", () => {
    render(<FamilyTodoFilter {...baseProps} />);
    expect(screen.getByText("All members")).toBeInTheDocument();
  });
});
