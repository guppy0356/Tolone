import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TeamMemberPicker } from "./TeamMemberPicker.component";

vi.mock("../members/Members.facade", () => ({
  useMembersFacade: ({ q }: { q: string }) => ({
    members: [
      { id: "m1", name: "Ada Lovelace" },
      { id: "m2", name: "Alan Turing" },
      { id: "m3", name: "Grace Hopper" },
    ].filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase())),
    isPending: false,
    isFetching: false,
  }),
}));

describe("TeamMemberPicker", () => {
  it("opens combobox when 'Add member' clicked and lists matches", async () => {
    const user = userEvent.setup();
    render(
      <TeamMemberPicker
        picked={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onRateChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Add member/ }));
    expect(
      screen.getByRole("combobox", { name: "Search members" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("filters as user types in the typeahead", async () => {
    const user = userEvent.setup();
    render(
      <TeamMemberPicker
        picked={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onRateChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Add member/ }));
    const input = screen.getByRole("combobox", { name: "Search members" });
    await user.type(input, "Ada");
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Alan Turing")).not.toBeInTheDocument();
  });

  it("calls onAdd when a candidate is clicked", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <TeamMemberPicker
        picked={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onRateChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Add member/ }));
    await user.click(screen.getByText("Grace Hopper"));
    expect(onAdd).toHaveBeenCalledWith({ id: "m3", name: "Grace Hopper" });
  });

  it("renders picked members with rate input and remove button", async () => {
    const onRateChange = vi.fn();
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <TeamMemberPicker
        picked={[{ memberId: "m1", name: "Ada Lovelace", hourlyRate: 120 }]}
        onAdd={vi.fn()}
        onRemove={onRemove}
        onRateChange={onRateChange}
      />,
    );
    const rateInput = screen.getByLabelText("Hourly rate for Ada Lovelace");
    expect(rateInput).toHaveValue(120);
    fireEvent.change(rateInput, { target: { value: "150" } });
    expect(onRateChange).toHaveBeenLastCalledWith("m1", 150);

    await user.click(screen.getByRole("button", { name: "Remove Ada Lovelace" }));
    expect(onRemove).toHaveBeenCalledWith("m1");
  });

  it("excludes already-picked members from candidates", async () => {
    const user = userEvent.setup();
    render(
      <TeamMemberPicker
        picked={[{ memberId: "m1", name: "Ada Lovelace", hourlyRate: 100 }]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onRateChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Add member/ }));
    // Ada is already picked → appears only in the chip area, not the dropdown
    const adaElements = screen.getAllByText("Ada Lovelace");
    expect(adaElements).toHaveLength(1);
    expect(screen.getByText("Alan Turing")).toBeInTheDocument();
  });
});
