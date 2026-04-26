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
import type { Book } from "./BookPreview.api";

const sampleBook: Book = {
  id: "1",
  title: "The Lantern Keeper",
  author: "Mira Halloway",
  summary: "A coastal town tends a single lantern.",
  totalPages: 6,
};

async function renderWithRouter(props: BookPreviewComponentProps) {
  const rootRoute = createRootRoute({
    component: () => <BookPreviewComponent {...props} />,
  });
  const readerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$id/read/$page",
  });
  const routeTree = rootRoute.addChildren([readerRoute]);
  const router = createRouter({ routeTree });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const baseProps: BookPreviewComponentProps = {
  book: sampleBook,
  isPending: false,
  isFetching: false,
  flash: undefined,
};

describe("BookPreviewComponent", () => {
  it("renders title, author, summary, and page count", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByText("The Lantern Keeper")).toBeInTheDocument();
    expect(screen.getByText("by Mira Halloway")).toBeInTheDocument();
    expect(
      screen.getByText("A coastal town tends a single lantern."),
    ).toBeInTheDocument();
    expect(screen.getByText("6 pages")).toBeInTheDocument();
  });

  it("renders Read link pointing to page 1", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByRole("link", { name: "Read" })).toHaveAttribute(
      "href",
      "/books/1/read/1",
    );
  });

  it("does not render flash banner when flash is undefined", async () => {
    await renderWithRouter(baseProps);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders flash banner when flash is login-required", async () => {
    await renderWithRouter({ ...baseProps, flash: "login-required" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "You need to log in to keep reading.",
    );
  });

  it("renders skeleton when isPending and book is undefined", async () => {
    await renderWithRouter({
      ...baseProps,
      book: undefined,
      isPending: true,
    });
    expect(screen.queryByText("The Lantern Keeper")).not.toBeInTheDocument();
  });
});
