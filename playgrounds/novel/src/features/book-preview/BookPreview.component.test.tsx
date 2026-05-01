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
  const readerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$id",
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
  });
  const routeTree = rootRoute.addChildren([readerRoute, loginRoute]);
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
  onBackToSummary: vi.fn(),
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

  it("calls onBackToSummary instead of Previous on page 1", async () => {
    const onBackToSummary = vi.fn();
    const user = userEvent.setup();
    await renderWithRouter({ ...baseProps, onBackToSummary });
    await user.click(screen.getByRole("button", { name: "← Back to summary" }));
    expect(onBackToSummary).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "← Previous" })).not.toBeInTheDocument();
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

  it("shows guest CTA after page 3", async () => {
    await renderWithRouter({ ...baseProps, currentPage: 4, page: undefined });
    expect(screen.getByText("You've reached the end of the preview.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Log in to keep reading" }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows logged-in CTA after page 3", async () => {
    await renderWithRouter({ ...baseProps, currentPage: 4, page: undefined, isLoggedIn: true });
    expect(
      screen.getByRole("link", { name: "Read the full book" }),
    ).toHaveAttribute("href", "/books/1");
  });

  it("logged-in users see skip-preview link on content pages", async () => {
    await renderWithRouter({ ...baseProps, isLoggedIn: true });
    expect(
      screen.getByRole("link", { name: "Skip preview · Read the full book →" }),
    ).toHaveAttribute("href", "/books/1");
  });

  it("renders skeleton when isPending", async () => {
    await renderWithRouter({ ...baseProps, book: undefined, isPending: true });
    expect(screen.queryByText("It was a quiet morning in the lighthouse.")).not.toBeInTheDocument();
  });
});
