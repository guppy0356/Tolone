import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReadingItemListComponent } from "./ReadingItemList.component";
import type { ReadingItemSummary } from "./ReadingItem.api";

const sampleItems: ReadingItemSummary[] = [
  {
    id: "a1",
    url: "https://example.com/alpha",
    title: "Alpha article",
    thumbnailUrl: "https://picsum.photos/seed/a1/320/180",
    status: "unread",
    createdAt: "2026-06-20T09:00:00Z",
  },
  {
    id: "a2",
    url: "https://example.com/beta",
    title: "Beta article",
    thumbnailUrl: "https://picsum.photos/seed/a2/320/180",
    status: "reading",
    createdAt: "2026-06-18T09:00:00Z",
  },
  {
    id: "a3",
    url: "https://example.com/gamma",
    title: "Gamma article",
    thumbnailUrl: "https://picsum.photos/seed/a3/320/180",
    status: "read",
    createdAt: "2026-06-15T09:00:00Z",
  },
];

const meta = {
  title: "features/ReadingItemList",
  component: ReadingItemListComponent,
  args: {
    items: sampleItems,
    total: 12,
    perPage: 5,
    query: { order: "desc", page: 1 },
    isPending: false,
    isRefetching: false,
    setQuery: fn(),
    addItem: fn(),
    deleteItem: fn(),
  },
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
      const detailRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/reading-list/$itemId",
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([detailRoute]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof ReadingItemListComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

function rowByTitle(canvasElement: HTMLElement, title: string): HTMLElement {
  const li = within(canvasElement).getByText(title).closest("li");
  if (!li) throw new Error(`No row for "${title}"`);
  return li as HTMLElement;
}

// --- Visual states ---
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Alpha article")).toBeInTheDocument();
    await expect(canvas.getByText("Page 1 of 3 · 12 items")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { items: [], total: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/No reading items match/),
    ).toBeInTheDocument();
  },
};

export const Skeleton: Story = {
  args: { isPending: true, items: [], total: 0 },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  },
};

// --- Interaction tests ---
export const AddsItem: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Paste a URL to save");
    await userEvent.type(input, "https://example.com/new");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(args.addItem).toHaveBeenCalledWith({
      url: "https://example.com/new",
    });
  },
};

export const DeletesItem: Story = {
  play: async ({ args, canvasElement }) => {
    const row = rowByTitle(canvasElement, "Alpha article");
    await userEvent.click(within(row).getByRole("button", { name: "Delete" }));
    await expect(args.deleteItem).toHaveBeenCalledWith("a1");
  },
};

export const ReadItemNotDeletable: Story = {
  play: async ({ canvasElement }) => {
    const row = rowByTitle(canvasElement, "Gamma article");
    await expect(
      within(row).getByRole("button", { name: "Delete" }),
    ).toBeDisabled();
  },
};

export const FiltersByStatus: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText("Status"), "reading");
    await expect(args.setQuery).toHaveBeenCalledWith({
      order: "desc",
      page: 1,
      status: "reading",
    });
  },
};

export const SortsByDate: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText("Sort"), "asc");
    await expect(args.setQuery).toHaveBeenCalledWith({ order: "asc", page: 1 });
  },
};

export const GoesToNextPage: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(args.setQuery).toHaveBeenCalledWith({ order: "desc", page: 2 });
  },
};
