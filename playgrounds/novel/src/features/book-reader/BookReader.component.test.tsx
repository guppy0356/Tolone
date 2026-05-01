import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { BookReaderComponent } from "./BookReader.component";
import type { BookReaderFacade } from "./BookReader.facade";

const samplePage = {
  number: 1,
  totalPages: 6,
  content: "It was a quiet morning in the lighthouse.",
};

async function renderWithRouter(props: BookReaderFacade) {
  const rootRoute = createRootRoute({
    component: () => <BookReaderComponent {...props} />,
  });
  const previewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/preview-books/$id",
  });
  const readerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$id",
  });
  const routeTree = rootRoute.addChildren([previewRoute, readerRoute]);
  const router = createRouter({ routeTree });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const sampleBook = {
  id: "1",
  title: "The Lantern Keeper",
  author: "Mira Halloway",
  summary: "A story of light and shadow.",
  totalPages: 6,
  currentPage: 1,
};

const baseProps: BookReaderFacade = {
  book: sampleBook,
  page: samplePage,
  isPending: false,
  isFetching: false,
  bookId: "1",
  pageNumber: 1,
  showSummary: false,
  startReading: vi.fn(),
  goNext: vi.fn().mockResolvedValue(undefined),
  goPrev: vi.fn().mockResolvedValue(undefined),
};

describe("BookReaderComponent", () => {
  it("shows summary and Start reading button when showSummary=true", async () => {
    const startReading = vi.fn();
    const user = userEvent.setup();
    await renderWithRouter({ ...baseProps, showSummary: true, startReading });
    expect(screen.getByText("The Lantern Keeper")).toBeInTheDocument();
    expect(screen.getByText("A story of light and shadow.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start reading →" }));
    expect(startReading).toHaveBeenCalled();
  });

  it("renders page content and pagination label", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.getByText("It was a quiet morning in the lighthouse."),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 6")).toBeInTheDocument();
  });

  it("Next on page 1 calls goNext", async () => {
    const goNext = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderWithRouter({ ...baseProps, goNext });
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(goNext).toHaveBeenCalled();
  });

  it("renders Back-to-preview link when on page 1 (no Previous button)", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.getByRole("link", { name: "← Back to preview" }),
    ).toHaveAttribute("href", "/preview-books/1");
    expect(
      screen.queryByRole("button", { name: "← Previous" }),
    ).not.toBeInTheDocument();
  });

  it("Previous on page 2 calls goPrev", async () => {
    const goPrev = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderWithRouter({
      ...baseProps,
      pageNumber: 2,
      page: { ...samplePage, number: 2 },
      goPrev,
    });
    await user.click(screen.getByRole("button", { name: "← Previous" }));
    expect(goPrev).toHaveBeenCalled();
  });

  it("hides Next button on the last page", async () => {
    await renderWithRouter({
      ...baseProps,
      pageNumber: 6,
      page: { ...samplePage, number: 6 },
    });
    expect(
      screen.queryByRole("button", { name: "Next →" }),
    ).not.toBeInTheDocument();
  });

  it("renders skeleton when isPending and page undefined", async () => {
    await renderWithRouter({
      ...baseProps,
      page: undefined,
      isPending: true,
    });
    expect(
      screen.queryByText("It was a quiet morning in the lighthouse."),
    ).not.toBeInTheDocument();
  });
});
