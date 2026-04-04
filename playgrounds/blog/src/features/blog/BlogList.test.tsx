import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { BlogList, type BlogListProps } from "./BlogList.component";
import type { BlogPost } from "./Blog.api";

const sampleBlogs: BlogPost[] = [
  {
    id: "1",
    title: "First Post",
    content: "Hello",
    createdAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "2",
    title: "Second Post",
    content: "",
    createdAt: "2026-04-02T14:30:00Z",
  },
];

async function renderWithRouter(props: BlogListProps) {
  const rootRoute = createRootRoute({
    component: () => <BlogList {...props} />,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/blogs/$id",
  });
  const routeTree = rootRoute.addChildren([detailRoute]);
  const router = createRouter({ routeTree });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("BlogList", () => {
  it("renders blog titles", async () => {
    await renderWithRouter({ blogs: sampleBlogs, isFetching: false });
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Second Post")).toBeInTheDocument();
  });

  it("renders empty state when no blogs", async () => {
    await renderWithRouter({ blogs: [], isFetching: false });
    expect(screen.getByText("No blog posts yet.")).toBeInTheDocument();
  });

  it("applies opacity when isFetching", async () => {
    const { container } = await renderWithRouter({
      blogs: sampleBlogs,
      isFetching: true,
    });
    await waitFor(() => {
      expect(container.querySelector("ul")).toHaveClass("opacity-50");
    });
  });

  it("renders links to detail pages", async () => {
    await renderWithRouter({ blogs: sampleBlogs, isFetching: false });
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/blogs/1");
    expect(links[1]).toHaveAttribute("href", "/blogs/2");
  });
});
