import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
    path: "/books/$id",
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

const baseProps: BookReaderFacade = {
  page: samplePage,
  isPending: false,
  isFetching: false,
  isLoggedIn: false,
  bookId: "1",
  pageNumber: 1,
};

describe("BookReaderComponent", () => {
  it("renders page content for guest on page 1", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.getByText("It was a quiet morning in the lighthouse."),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 6")).toBeInTheDocument();
  });

  it("renders page content for guest on page 2", async () => {
    await renderWithRouter({
      ...baseProps,
      pageNumber: 2,
      page: { ...samplePage, number: 2 },
    });
    expect(
      screen.getByText("It was a quiet morning in the lighthouse."),
    ).toBeInTheDocument();
  });

  it("renders gate (no content) for guest on page 3", async () => {
    await renderWithRouter({
      ...baseProps,
      pageNumber: 3,
      page: { ...samplePage, number: 3 },
    });
    expect(screen.getByText("Login to continue reading.")).toBeInTheDocument();
    expect(
      screen.queryByText("It was a quiet morning in the lighthouse."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders content (no gate) for logged-in user on page 3", async () => {
    await renderWithRouter({
      ...baseProps,
      pageNumber: 3,
      isLoggedIn: true,
      page: { ...samplePage, number: 3 },
    });
    expect(
      screen.getByText("It was a quiet morning in the lighthouse."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Login to continue reading."),
    ).not.toBeInTheDocument();
  });

  it("renders Next link to page 2 from page 1", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByRole("link", { name: "Next →" })).toHaveAttribute(
      "href",
      "/books/1/read/2",
    );
  });

  it("renders Back to preview when on page 1 (no Previous)", async () => {
    await renderWithRouter(baseProps);
    expect(
      screen.getByRole("link", { name: "← Back to preview" }),
    ).toHaveAttribute("href", "/books/1");
  });

  it("renders Previous link from page 2", async () => {
    await renderWithRouter({
      ...baseProps,
      pageNumber: 2,
      page: { ...samplePage, number: 2 },
    });
    expect(screen.getByRole("link", { name: "← Previous" })).toHaveAttribute(
      "href",
      "/books/1/read/1",
    );
  });

  it("hides Next link on the last page", async () => {
    await renderWithRouter({
      ...baseProps,
      pageNumber: 6,
      isLoggedIn: true,
      page: { ...samplePage, number: 6 },
    });
    expect(
      screen.queryByRole("link", { name: "Next →" }),
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
