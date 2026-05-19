import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { BlogList } from "./BlogList.component";
import type { BlogPost } from "../Blog.api";

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

const meta = {
  title: "features/BlogList",
  component: BlogList,
  args: {
    blogs: sampleBlogs,
    isFetching: false,
  },
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
      const detailRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/blogs/$id",
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([detailRoute]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof BlogList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("First Post")).toBeInTheDocument();
    await expect(canvas.getByText("Second Post")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { blogs: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("No blog posts yet.")).toBeInTheDocument();
  },
};

export const FetchingOpacity: Story = {
  args: { isFetching: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("ul")).toHaveClass("opacity-50");
  },
};

export const LinksToDetail: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole("link");
    await expect(links[0]).toHaveAttribute("href", "/blogs/1");
    await expect(links[1]).toHaveAttribute("href", "/blogs/2");
  },
};
