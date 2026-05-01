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
import type { BookPreview } from "./BookPreview.api";

const sampleBook: BookPreview = {
  id: "1",
  title: "The Lantern Keeper",
  author: "Mira Halloway",
  summary: "A coastal town tends a single lantern.",
  totalPages: 6,
  pages: [],
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
  isPending: false,
  isFetching: false,
  bookId: "1",
  isLoggedIn: false,
};

describe("BookPreviewComponent", () => {
  it("shows title, author, and summary", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByText("The Lantern Keeper")).toBeInTheDocument();
    expect(screen.getByText("by Mira Halloway")).toBeInTheDocument();
    expect(screen.getByText("A coastal town tends a single lantern.")).toBeInTheDocument();
  });

  it("shows login link for guests", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.getByRole("link", { name: "Log in to read" }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows reader link for logged-in users", async () => {
    await renderWithRouter({ ...baseProps, isLoggedIn: true });
    expect(
      screen.getByRole("link", { name: "Read the full book" }),
    ).toHaveAttribute("href", "/books/1");
  });

  it("renders skeleton when isPending", async () => {
    await renderWithRouter({ ...baseProps, book: undefined, isPending: true });
    expect(screen.queryByText("The Lantern Keeper")).not.toBeInTheDocument();
  });
});
