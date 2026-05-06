import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import {
  BookPreviewComponent,
  type BookPreviewComponentProps,
} from "./BookPreview.component";
import type { BookPreview, Page } from "./BookPreview.api";

const samplePage: Page = {
  number: 1,
  totalPages: 6,
  content: "It was a quiet morning in the lighthouse.",
};

const sampleBook: BookPreview = {
  id: "1",
  title: "The Lantern Keeper",
  author: "Mira Halloway",
  summary: "A coastal town tends a single lantern.",
  totalPages: 6,
  pages: [samplePage],
};

async function renderWithRouter(props: BookPreviewComponentProps) {
  const rootRoute = createRootRoute({
    component: () => <BookPreviewComponent {...props} />,
  });
  const previewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/preview-books/$id",
  });
  const readerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$id",
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
  });
  const routeTree = rootRoute.addChildren([previewRoute, readerRoute, loginRoute]);
  const router = createRouter({ routeTree });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const baseProps: BookPreviewComponentProps = {
  book: sampleBook,
  page: samplePage,
  isPending: false,
  isFetching: false,
  bookId: "1",
  currentPage: 1,
  setCurrentPage: vi.fn(),
};

describe("BookPreviewComponent", () => {
  it("shows page content and pagination label", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByText("It was a quiet morning in the lighthouse.")).toBeInTheDocument();
    expect(screen.getByText("Preview · Page 1 of 6")).toBeInTheDocument();
  });

  it("calls setCurrentPage(2) when Next clicked", async () => {
    const setCurrentPage = vi.fn();
    const user = userEvent.setup();
    await renderWithRouter({ ...baseProps, setCurrentPage });
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(setCurrentPage).toHaveBeenCalledWith(2);
  });

  it("no Previous button on page 1", async () => {
    await renderWithRouter(baseProps);
    expect(screen.queryByRole("button", { name: "← Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "← Back to summary" })).not.toBeInTheDocument();
  });

  it("Previous on page 2 calls setCurrentPage(1)", async () => {
    const setCurrentPage = vi.fn();
    const user = userEvent.setup();
    await renderWithRouter({
      ...baseProps,
      currentPage: 2,
      page: { ...samplePage, number: 2 },
      setCurrentPage,
    });
    await user.click(screen.getByRole("button", { name: "← Previous" }));
    expect(setCurrentPage).toHaveBeenCalledWith(1);
  });

  it("shows CTA after page 4", async () => {
    await renderWithRouter({ ...baseProps, currentPage: 5, page: undefined });
    expect(screen.getByText("You've reached the end of the preview.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Log in to keep reading" }),
    ).toHaveAttribute("href", "/login");
  });

  it("renders skeleton when isPending", async () => {
    await renderWithRouter({ ...baseProps, book: undefined, isPending: true });
    expect(screen.queryByText("It was a quiet morning in the lighthouse.")).not.toBeInTheDocument();
  });
});
