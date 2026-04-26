import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
import type { Book, Page } from "./BookPreview.api";

const sampleBook: Book = {
  id: "1",
  title: "The Lantern Keeper",
  author: "Mira Halloway",
  summary: "A coastal town tends a single lantern.",
  totalPages: 6,
};

const samplePage: Page = {
  number: 1,
  totalPages: 6,
  content: "It was a quiet morning in the lighthouse.",
};

async function renderWithRouter(props: BookPreviewComponentProps) {
  const rootRoute = createRootRoute({
    component: () => <BookPreviewComponent {...props} />,
  });
  const previewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$id",
    validateSearch: () => ({ page: 1, flash: undefined }),
  });
  const readerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$id/read/$page",
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
  flash: undefined,
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

  it("renders Next link to ?page=2 from page 1, no Previous", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/books/1?page=2",
    );
    expect(
      screen.queryByRole("link", { name: "← Previous" }),
    ).not.toBeInTheDocument();
  });

  it("renders Previous and Next on page 2", async () => {
    await renderWithRouter({
      ...baseProps,
      currentPage: 2,
      page: { ...samplePage, number: 2 },
    });
    expect(screen.getByRole("link", { name: "← Previous" })).toHaveAttribute(
      "href",
      "/books/1?page=1",
    );
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/books/1?page=3",
    );
  });

  it("renders Next on page 3 (so guest can hit the CTA at page 4)", async () => {
    await renderWithRouter({
      ...baseProps,
      currentPage: 3,
      page: { ...samplePage, number: 3 },
    });
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/books/1?page=4",
    );
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
    ).toHaveAttribute("href", "/books/1/read/1");
  });

  it("hides Next link at page 4 (CTA state)", async () => {
    await renderWithRouter({
      ...baseProps,
      currentPage: 4,
      page: undefined,
    });
    expect(
      screen.queryByRole("link", { name: "Next →" }),
    ).not.toBeInTheDocument();
  });

  it("logged-in users see a Skip-preview link on content pages", async () => {
    await renderWithRouter({ ...baseProps, isLoggedIn: true });
    expect(
      screen.getByRole("link", { name: "Skip preview · Read the full book →" }),
    ).toHaveAttribute("href", "/books/1/read/1");
  });

  it("guests do not see a Skip-preview link", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.queryByRole("link", { name: /Skip preview/ }),
    ).not.toBeInTheDocument();
  });

  it("shows flash banner when flash is login-required", async () => {
    await renderWithRouter({ ...baseProps, flash: "login-required" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You need to log in to keep reading.",
    );
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
