import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FamilyTodoFilter } from "./FamilyTodoFilter.component";
import type { FamilyTodoFilterProps } from "./FamilyTodoFilter.presenter";

const baseProps: FamilyTodoFilterProps = {
  selectedMembers: [],
  selectMember: vi.fn(),
};

describe("FamilyTodoFilter", () => {
  it("calls selectMember when selecting a member", async () => {
    const selectMember = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoFilter {...baseProps} selectMember={selectMember} />,
    );
    await user.click(screen.getByRole("combobox", { name: "Filter by member" }));
    await user.click(screen.getByRole("button", { name: /Mama/ }));
    expect(selectMember).toHaveBeenCalledWith("Mama");
  });

  it("shows chips for selected members", () => {
    render(
      <FamilyTodoFilter {...baseProps} selectedMembers={["Mama", "Taro"]} />,
    );
    expect(screen.getByRole("button", { name: "Remove Mama" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Taro" })).toBeInTheDocument();
  });

  it("calls selectMember when clicking chip remove button", async () => {
    const selectMember = vi.fn();
    const user = userEvent.setup();
    render(
      <FamilyTodoFilter
        {...baseProps}
        selectedMembers={["Mama"]}
        selectMember={selectMember}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove Mama" }));
    expect(selectMember).toHaveBeenCalledWith("Mama");
  });

  it("shows 'All members' when nothing is selected", () => {
    render(<FamilyTodoFilter {...baseProps} />);
    expect(screen.getByText("All members")).toBeInTheDocument();
  });
});
