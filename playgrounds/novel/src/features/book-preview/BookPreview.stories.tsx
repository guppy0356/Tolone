import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  BookPreviewComponent,
  BookPreviewSkeleton,
} from "./BookPreview.component";
import type { BookPreview, Page } from "./BookPreview.api";

const samplePage: Page = {
  number: 1,
  totalPages: 6,
  content: "It was a quiet morning in the lighthouse.",
};

const sampleBook: BookPreview = {
  id: "1",
  title: "The Lantern Keeper",
  author: "Mira Halloway",
  summary: "A coastal town tends a single lantern.",
  totalPages: 6,
  pages: [samplePage],
};

const meta = {
  title: "features/BookPreview",
  component: BookPreviewComponent,
  args: {
    book: sampleBook,
    page: samplePage,
    isPending: false,
    isFetching: false,
    bookId: "1",
    currentPage: 1,
    setCurrentPage: fn(),
  },
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
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
      const router = createRouter({
        routeTree: rootRoute.addChildren([
          previewRoute,
          readerRoute,
          loginRoute,
        ]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof BookPreviewComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("It was a quiet morning in the lighthouse."),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Preview · Page 1 of 6"),
    ).toBeInTheDocument();
  },
};

export const Skeleton: StoryObj = {
  render: () => <BookPreviewSkeleton />,
};

export const ClickingNextAdvances: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Next →" }));
    await expect(args.setCurrentPage).toHaveBeenCalledWith(2);
  },
};

export const NoPreviousOnPageOne: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: "← Previous" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "← Back to summary" }),
    ).not.toBeInTheDocument();
  },
};

export const PreviousOnPageTwoGoesBack: Story = {
  args: {
    currentPage: 2,
    page: { ...samplePage, number: 2 },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "← Previous" }));
    await expect(args.setCurrentPage).toHaveBeenCalledWith(1);
  },
};

export const EndOfPreviewCTA: Story = {
  args: { currentPage: 5, page: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("You've reached the end of the preview."),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "Log in to keep reading" }),
    ).toHaveAttribute("href", "/login");
  },
};

export const PendingHidesContent: Story = {
  args: { book: undefined, isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByText("It was a quiet morning in the lighthouse."),
    ).not.toBeInTheDocument();
  },
};
