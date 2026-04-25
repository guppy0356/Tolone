import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PatComponent } from "./Pat.component";
import type { PatFacade } from "./Pat.facade";

const seededPats = [
  { id: "pat_1", title: "Personal laptop", createdAt: "2026-01-12T09:00:00Z" },
  { id: "pat_2", title: "CI runner", createdAt: "2026-01-22T14:30:00Z" },
  { id: "pat_3", title: "Mobile dev", createdAt: "2026-02-03T18:15:00Z" },
  { id: "pat_4", title: "Read-only audit", createdAt: "2026-02-19T11:45:00Z" },
  { id: "pat_5", title: "Backup script", createdAt: "2026-03-08T07:22:00Z" },
];

const baseFacade: PatFacade = {
  pats: seededPats,
  isPending: false,
  isFetching: false,
  addPat: vi.fn(),
  updatePat: vi.fn(),
  deletePat: vi.fn(),
};

describe("PatComponent", () => {
  it("renders all 5 seeded pats", () => {
    render(<PatComponent {...baseFacade} />);
    for (const pat of seededPats) {
      expect(screen.getByText(pat.title)).toBeInTheDocument();
    }
  });

  it("calls addPat with trimmed title on submit", async () => {
    const addPat = vi.fn();
    const user = userEvent.setup();
    render(<PatComponent {...baseFacade} addPat={addPat} />);
    await user.type(screen.getByPlaceholderText("Token name"), "  New token  ");
    await user.click(screen.getByText("Generate token"));
    expect(addPat).toHaveBeenCalledWith({ title: "New token" });
  });

  it("shows 'Failed to create token' when addPat rejects", async () => {
    const addPat = vi.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<PatComponent {...baseFacade} addPat={addPat} />);
    await user.type(screen.getByPlaceholderText("Token name"), "Test");
    await user.click(screen.getByText("Generate token"));
    expect(
      await screen.findByText("Failed to create token"),
    ).toBeInTheDocument();
  });

  it("dismisses create error when × clicked", async () => {
    const addPat = vi.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<PatComponent {...baseFacade} addPat={addPat} />);
    await user.type(screen.getByPlaceholderText("Token name"), "Test");
    await user.click(screen.getByText("Generate token"));
    await screen.findByText("Failed to create token");
    await user.click(screen.getByLabelText("Dismiss create error"));
    expect(screen.queryByText("Failed to create token")).not.toBeInTheDocument();
  });

  it("pencil click reveals edit input; Save calls updatePat", async () => {
    const updatePat = vi.fn();
    const user = userEvent.setup();
    render(<PatComponent {...baseFacade} updatePat={updatePat} />);
    await user.click(screen.getByLabelText("Edit Personal laptop"));
    const input = screen.getByLabelText("Edit title for Personal laptop");
    await user.clear(input);
    await user.type(input, "Renamed laptop");
    await user.click(screen.getByText("Save"));
    expect(updatePat).toHaveBeenCalledWith("pat_1", { title: "Renamed laptop" });
  });

  it("shows 'Failed to update token' near row when updatePat rejects", async () => {
    const updatePat = vi.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<PatComponent {...baseFacade} updatePat={updatePat} />);
    await user.click(screen.getByLabelText("Edit Personal laptop"));
    await user.click(screen.getByText("Save"));
    expect(
      await screen.findByText("Failed to update token"),
    ).toBeInTheDocument();
  });

  it("calls deletePat when Delete clicked", async () => {
    const deletePat = vi.fn();
    const user = userEvent.setup();
    render(<PatComponent {...baseFacade} deletePat={deletePat} />);
    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);
    expect(deletePat).toHaveBeenCalledWith("pat_1");
  });

  it("shows 'Failed to delete token' near row when deletePat rejects", async () => {
    const deletePat = vi.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<PatComponent {...baseFacade} deletePat={deletePat} />);
    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);
    expect(
      await screen.findByText("Failed to delete token"),
    ).toBeInTheDocument();
  });

  it("dismisses row error when × clicked", async () => {
    const deletePat = vi.fn().mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<PatComponent {...baseFacade} deletePat={deletePat} />);
    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);
    await screen.findByText("Failed to delete token");
    await user.click(screen.getByLabelText("Dismiss error for Personal laptop"));
    expect(
      screen.queryByText("Failed to delete token"),
    ).not.toBeInTheDocument();
  });

  it("renders skeleton when isPending", () => {
    render(<PatComponent {...baseFacade} pats={[]} isPending={true} />);
    expect(screen.queryByText("Personal laptop")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Token name")).toBeDisabled();
  });
});
