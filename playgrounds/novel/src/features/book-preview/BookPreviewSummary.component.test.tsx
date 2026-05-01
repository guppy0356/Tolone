import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BookPreviewSummaryComponent } from "./BookPreviewSummary.component";
import type { BookPreviewSummaryComponentProps } from "./BookPreviewSummary.component";
import type { BookPreview } from "./BookPreview.api";

const sampleBook: BookPreview = {
  id: "1",
  title: "The Lantern Keeper",
  author: "Mira Halloway",
  summary: "A coastal town tends a single lantern.",
  totalPages: 6,
  pages: [],
};

const baseProps: BookPreviewSummaryComponentProps = {
  book: sampleBook,
  isPending: false,
  isFetching: false,
  onStartReading: vi.fn(),
};

describe("BookPreviewSummaryComponent", () => {
  it("shows title, author, and summary", () => {
    render(<BookPreviewSummaryComponent {...baseProps} />);
    expect(screen.getByText("The Lantern Keeper")).toBeInTheDocument();
    expect(screen.getByText("by Mira Halloway")).toBeInTheDocument();
    expect(screen.getByText("A coastal town tends a single lantern.")).toBeInTheDocument();
  });

  it("calls onStartReading when button clicked", async () => {
    const onStartReading = vi.fn();
    const user = userEvent.setup();
    render(<BookPreviewSummaryComponent {...baseProps} onStartReading={onStartReading} />);
    await user.click(screen.getByRole("button", { name: "Start reading →" }));
    expect(onStartReading).toHaveBeenCalled();
  });

  it("renders skeleton when isPending", () => {
    render(<BookPreviewSummaryComponent {...baseProps} book={undefined} isPending={true} />);
    expect(screen.queryByText("The Lantern Keeper")).not.toBeInTheDocument();
  });
});
