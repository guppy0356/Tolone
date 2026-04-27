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
  SidebarComponent,
  type SidebarComponentProps,
} from "./Sidebar.component";
import type { BookSummary } from "./Sidebar.api";

const sampleBooks: BookSummary[] = [
  { id: "1", title: "The Lantern Keeper", author: "Mira Halloway" },
  { id: "2", title: "Threads of the Northern Loom", author: "Ivar Beska" },
  { id: "3", title: "Quiet Cities", author: "Ren Tanaka" },
];

async function renderWithRouter(props: SidebarComponentProps) {
  const rootRoute = createRootRoute({
    component: () => <SidebarComponent {...props} />,
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

const baseProps: SidebarComponentProps = {
  books: sampleBooks,
  isPending: false,
  isFetching: false,
  logout: vi.fn().mockResolvedValue(undefined),
  currentBookId: undefined,
  isLoggedIn: false,
};

describe("SidebarComponent", () => {
  it("renders all books with title and author", async () => {
    await renderWithRouter(baseProps);
    expect(screen.getByText("The Lantern Keeper")).toBeInTheDocument();
    expect(screen.getByText("Mira Halloway")).toBeInTheDocument();
    expect(screen.getByText("Quiet Cities")).toBeInTheDocument();
  });

  it("links each book to its preview when not logged in", async () => {
    await renderWithRouter(baseProps);
    const bookLinks = screen
      .getAllByRole("link")
      .filter((l) =>
        l.getAttribute("href")?.startsWith("/preview-books/"),
      );
    expect(bookLinks[0]).toHaveAttribute("href", "/preview-books/1");
    expect(bookLinks[1]).toHaveAttribute("href", "/preview-books/2");
    expect(bookLinks[2]).toHaveAttribute("href", "/preview-books/3");
  });

  it("links each book to the reader when logged in", async () => {
    await renderWithRouter({ ...baseProps, isLoggedIn: true });
    const bookLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/books/"));
    expect(bookLinks[0]).toHaveAttribute("href", "/books/1");
    expect(bookLinks[1]).toHaveAttribute("href", "/books/2");
    expect(bookLinks[2]).toHaveAttribute("href", "/books/3");
  });

  it("highlights current book when currentBookId matches", async () => {
    await renderWithRouter({ ...baseProps, currentBookId: "2" });
    const currentLink = screen
      .getByText("Threads of the Northern Loom")
      .closest("a");
    expect(currentLink?.className).toContain("bg-blue-100");
  });

  it("shows Login link when not logged in", async () => {
    await renderWithRouter(baseProps);
    const loginLink = screen.getByRole("link", { name: "Login" });
    expect(loginLink).toHaveAttribute("href", "/login");
    expect(
      screen.queryByRole("button", { name: "Logout" }),
    ).not.toBeInTheDocument();
  });

  it("shows Logout button when logged in", async () => {
    await renderWithRouter({ ...baseProps, isLoggedIn: true });
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Login" }),
    ).not.toBeInTheDocument();
  });

  it("calls logout when Logout button is clicked", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    await renderWithRouter({ ...baseProps, isLoggedIn: true, logout });
    await user.click(screen.getByRole("button", { name: "Logout" }));
    expect(logout).toHaveBeenCalled();
  });

  it("renders skeleton when isPending", async () => {
    await renderWithRouter({ ...baseProps, books: [], isPending: true });
    expect(screen.queryByText("The Lantern Keeper")).not.toBeInTheDocument();
  });
});
