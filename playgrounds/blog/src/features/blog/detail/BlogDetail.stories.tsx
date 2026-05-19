import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import {
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { BlogDetail } from "./BlogDetail.component";
import type { BlogPost } from "../Blog.api";

const sampleBlog: BlogPost = {
  id: "1",
  title: "Test Blog",
  content: "This is the blog content.",
  createdAt: "2026-04-01T10:00:00Z",
};

const meta = {
  title: "features/BlogDetail",
  component: BlogDetail,
  args: {
    blog: sampleBlog,
    isPending: false,
    isFetching: false,
  },
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
      const router = createRouter({
        routeTree: rootRoute.addChildren([]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof BlogDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Test Blog")).toBeInTheDocument();
    await expect(
      canvas.getByText("This is the blog content."),
    ).toBeInTheDocument();
    await expect(canvas.getByText("April 1, 2026")).toBeInTheDocument();
  },
};

export const Skeleton: Story = {
  args: { blog: undefined, isPending: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".animate-pulse")).toBeInTheDocument();
  },
};

export const NotFound: Story = {
  args: { blog: undefined, isPending: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Blog post not found.")).toBeInTheDocument();
  },
};

export const HasBackLink: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Back to list")).toHaveAttribute("href", "/");
  },
};
