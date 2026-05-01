import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
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

async function renderWithRouter(props: BookPreviewSummaryComponentProps) {
  const rootRoute = createRootRoute({
    component: () => <BookPreviewSummaryComponent {...props} />,
  });
  const readRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/preview-books/$id/read",
  });
  const routeTree = rootRoute.addChildren([readRoute]);
  const router = createRouter({ routeTree });
  await router.load();
  return render(<RouterProvider router={router} />);
}

const baseProps: BookPreviewSummaryComponentProps = {
  book: sampleBook,
  isPending: false,
  isFetching: false,
  bookId: "1",
};

describe("BookPreviewSummaryComponent", () => {
  it("shows title, author, and summary", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByText("The Lantern Keeper")).toBeInTheDocument();
    expect(screen.getByText("by Mira Halloway")).toBeInTheDocument();
    expect(screen.getByText("A coastal town tends a single lantern.")).toBeInTheDocument();
  });

  it("Start reading link points to /preview-books/$id/read", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.getByRole("link", { name: "Start reading →" }),
    ).toHaveAttribute("href", "/preview-books/1/read");
  });

  it("renders skeleton when isPending", async () => {
    await renderWithRouter({ ...baseProps, book: undefined, isPending: true });
    expect(screen.queryByText("The Lantern Keeper")).not.toBeInTheDocument();
  });
});
