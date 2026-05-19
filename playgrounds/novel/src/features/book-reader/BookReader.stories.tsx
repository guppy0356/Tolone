import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  BookReaderComponent,
  BookReaderSkeleton,
} from "./BookReader.component";

const samplePage = {
  number: 1,
  totalPages: 6,
  content: "It was a quiet morning in the lighthouse.",
};

const sampleBook = {
  id: "1",
  title: "The Lantern Keeper",
  author: "Mira Halloway",
  summary: "A story of light and shadow.",
  totalPages: 6,
  currentPage: 1,
  pageContent: "It was a quiet morning in the lighthouse.",
};

const meta = {
  title: "features/BookReader",
  component: BookReaderComponent,
  args: {
    book: sampleBook,
    page: samplePage,
    isPending: false,
    isFetching: false,
    bookId: "1",
    pageNumber: 1,
    goNext: fn(() => Promise.resolve()),
    goPrev: fn(() => Promise.resolve()),
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
      const router = createRouter({
        routeTree: rootRoute.addChildren([previewRoute, readerRoute]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof BookReaderComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("It was a quiet morning in the lighthouse."),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Page 1 of 6")).toBeInTheDocument();
  },
};

export const Skeleton: StoryObj = {
  render: () => <BookReaderSkeleton />,
};

export const NextOnPageOne: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Next →" }));
    await expect(args.goNext).toHaveBeenCalled();
  },
};

export const BackToPreviewLinkOnPageOne: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "← Back to preview" }),
    ).toHaveAttribute("href", "/preview-books/1");
    await expect(
      canvas.queryByRole("button", { name: "← Previous" }),
    ).not.toBeInTheDocument();
  },
};

export const PreviousOnPageTwo: Story = {
  args: { pageNumber: 2, page: { ...samplePage, number: 2 } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "← Previous" }));
    await expect(args.goPrev).toHaveBeenCalled();
  },
};

export const NoNextOnLastPage: Story = {
  args: { pageNumber: 6, page: { ...samplePage, number: 6 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: "Next →" }),
    ).not.toBeInTheDocument();
  },
};

export const PendingHidesContent: Story = {
  args: { page: undefined, isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByText("It was a quiet morning in the lighthouse."),
    ).not.toBeInTheDocument();
  },
};
