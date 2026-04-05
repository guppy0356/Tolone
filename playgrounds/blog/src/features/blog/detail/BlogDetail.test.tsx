import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  createRouter,
  createRootRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { BlogDetail } from "./BlogDetail.component";
import type { BlogDetailFacade } from "./BlogDetail.facade";
import type { BlogPost } from "../Blog.api";

const sampleBlog: BlogPost = {
  id: "1",
  title: "Test Blog",
  content: "This is the blog content.",
  createdAt: "2026-04-01T10:00:00Z",
};

async function renderWithRouter(props: BlogDetailFacade) {
  const rootRoute = createRootRoute({
    component: () => <BlogDetail {...props} />,
  });
  const routeTree = rootRoute.addChildren([]);
  const router = createRouter({ routeTree });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("BlogDetail", () => {
  it("renders blog title and content", async () => {
    await renderWithRouter({
      blog: sampleBlog,
      isPending: false,
      isFetching: false,
    });
    expect(screen.getByText("Test Blog")).toBeInTheDocument();
    expect(screen.getByText("This is the blog content.")).toBeInTheDocument();
  });

  it("renders formatted date", async () => {
    await renderWithRouter({
      blog: sampleBlog,
      isPending: false,
      isFetching: false,
    });
    expect(screen.getByText("April 1, 2026")).toBeInTheDocument();
  });

  it("shows skeleton during isPending", async () => {
    const { container } = await renderWithRouter({
      blog: undefined,
      isPending: true,
      isFetching: false,
    });
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows not found when blog is undefined and not pending", async () => {
    await renderWithRouter({
      blog: undefined,
      isPending: false,
      isFetching: false,
    });
    expect(screen.getByText("Blog post not found.")).toBeInTheDocument();
  });

  it("renders back link", async () => {
    await renderWithRouter({
      blog: sampleBlog,
      isPending: false,
      isFetching: false,
    });
    expect(screen.getByText("Back to list")).toHaveAttribute("href", "/");
  });
});
