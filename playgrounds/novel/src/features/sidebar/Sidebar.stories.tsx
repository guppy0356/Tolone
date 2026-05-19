import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { SidebarComponent } from "./Sidebar.component";
import type { BookSummary } from "./Sidebar.api";

const sampleBooks: BookSummary[] = [
  { id: "1", title: "The Lantern Keeper", author: "Mira Halloway" },
  { id: "2", title: "Threads of the Northern Loom", author: "Ivar Beska" },
  { id: "3", title: "Quiet Cities", author: "Ren Tanaka" },
];

const meta = {
  title: "features/Sidebar",
  component: SidebarComponent,
  args: {
    books: sampleBooks,
    isPending: false,
    isFetching: false,
    logout: fn(() => Promise.resolve()),
    currentBookId: undefined,
    isLoggedIn: false,
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
} satisfies Meta<typeof SidebarComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("The Lantern Keeper")).toBeInTheDocument();
    await expect(canvas.getByText("Mira Halloway")).toBeInTheDocument();
    await expect(canvas.getByText("Quiet Cities")).toBeInTheDocument();
  },
};

export const Skeleton: Story = {
  args: { isPending: true, books: [] },
};

export const LinksToPreviewWhenLoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bookLinks = canvas
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/preview-books/"));
    await expect(bookLinks[0]).toHaveAttribute("href", "/preview-books/1");
    await expect(bookLinks[1]).toHaveAttribute("href", "/preview-books/2");
    await expect(bookLinks[2]).toHaveAttribute("href", "/preview-books/3");
  },
};

export const LinksToReaderWhenLoggedIn: Story = {
  args: { isLoggedIn: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bookLinks = canvas
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/books/"));
    await expect(bookLinks[0]).toHaveAttribute("href", "/books/1");
    await expect(bookLinks[1]).toHaveAttribute("href", "/books/2");
    await expect(bookLinks[2]).toHaveAttribute("href", "/books/3");
  },
};

export const HighlightsCurrentBook: Story = {
  args: { currentBookId: "2" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const currentLink = canvas
      .getByText("Threads of the Northern Loom")
      .closest("a");
    await expect(currentLink?.className).toContain("bg-blue-100");
  },
};

export const ShowsLoginWhenLoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loginLink = canvas.getByRole("link", { name: "Login" });
    await expect(loginLink).toHaveAttribute("href", "/login");
    await expect(
      canvas.queryByRole("button", { name: "Logout" }),
    ).not.toBeInTheDocument();
  },
};

export const ShowsLogoutWhenLoggedIn: Story = {
  args: { isLoggedIn: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Logout" }),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: "Login" }),
    ).not.toBeInTheDocument();
  },
};

export const LogoutCallsLogout: Story = {
  args: { isLoggedIn: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Logout" }));
    await expect(args.logout).toHaveBeenCalled();
  },
};

export const PendingHidesContent: Story = {
  args: { books: [], isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByText("The Lantern Keeper"),
    ).not.toBeInTheDocument();
  },
};
