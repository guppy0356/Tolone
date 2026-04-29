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
  const routeTree = rootRoute.addChildren([
    previewRoute,
    readerRoute,
    loginRoute,
  ]);
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
  isLoggedIn: false,
};

describe("BookPreviewComponent", () => {
  it("shows metadata + summary on page 1", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByText("The Lantern Keeper")).toBeInTheDocument();
    expect(screen.getByText("by Mira Halloway")).toBeInTheDocument();
    expect(
      screen.getByText("A coastal town tends a single lantern."),
    ).toBeInTheDocument();
  });

  it("shows page content and pagination label", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.getByText("It was a quiet morning in the lighthouse."),
    ).toBeInTheDocument();
    expect(screen.getByText("Preview · Page 1 of 6")).toBeInTheDocument();
  });

  it("hides summary on pages > 1", async () => {
    await renderWithRouter({
      ...baseProps,
      currentPage: 2,
      page: { ...samplePage, number: 2 },
    });
    expect(
      screen.queryByText("A coastal town tends a single lantern."),
    ).not.toBeInTheDocument();
  });

  it("calls setCurrentPage(2) when Next clicked from page 1; no Previous", async () => {
    const setCurrentPage = vi.fn();
    const user = userEvent.setup();
    await renderWithRouter({ ...baseProps, setCurrentPage });
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(setCurrentPage).toHaveBeenCalledWith(2);
    expect(
      screen.queryByRole("button", { name: "← Previous" }),
    ).not.toBeInTheDocument();
  });

  it("Previous and Next on page 2 call setCurrentPage with adjacent values", async () => {
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
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(setCurrentPage).toHaveBeenCalledWith(3);
  });

  it("Next button still present on page 3 (so user can hit the CTA at page 4)", async () => {
    const setCurrentPage = vi.fn();
    const user = userEvent.setup();
    await renderWithRouter({
      ...baseProps,
      currentPage: 3,
      page: { ...samplePage, number: 3 },
      setCurrentPage,
    });
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(setCurrentPage).toHaveBeenCalledWith(4);
  });

  it("shows guest CTA (login link) on page 4 instead of content", async () => {
    await renderWithRouter({
      ...baseProps,
      currentPage: 4,
      page: undefined,
    });
    expect(
      screen.getByText("You've reached the end of the preview."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("It was a quiet morning in the lighthouse."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Log in to keep reading" }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows logged-in CTA (full-book link) on page 4", async () => {
    await renderWithRouter({
      ...baseProps,
      currentPage: 4,
      page: undefined,
      isLoggedIn: true,
    });
    expect(
      screen.getByRole("link", { name: "Read the full book" }),
    ).toHaveAttribute("href", "/books/1");
  });

  it("hides Next button at page 4 (CTA state)", async () => {
    await renderWithRouter({
      ...baseProps,
      currentPage: 4,
      page: undefined,
    });
    expect(
      screen.queryByRole("button", { name: "Next →" }),
    ).not.toBeInTheDocument();
  });

  it("logged-in users see a Skip-preview link on content pages", async () => {
    await renderWithRouter({ ...baseProps, isLoggedIn: true });
    expect(
      screen.getByRole("link", { name: "Skip preview · Read the full book →" }),
    ).toHaveAttribute("href", "/books/1");
  });

  it("guests do not see a Skip-preview link", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.queryByRole("link", { name: /Skip preview/ }),
    ).not.toBeInTheDocument();
  });

  it("renders skeleton when isPending and book undefined", async () => {
    await renderWithRouter({
      ...baseProps,
      book: undefined,
      isPending: true,
    });
    expect(screen.queryByText("The Lantern Keeper")).not.toBeInTheDocument();
  });
});
