import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReadingItemListComponent } from "./ReadingItemList.component";
import type { ReadingItemSummary } from "./ReadingItem.api";
import { readingListSearchSchema } from "./ReadingItem.schema";

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

// Filter/sort/pagination now write the URL (Link/navigate), so the story mounts
// the Component on a real /reading-list route and asserts the resulting search.
// The router is captured per render so play functions can read its location.
let storyRouter: ReturnType<typeof createRouter>;

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
    addItem: fn(),
    deleteItem: fn(),
  },
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute();
      const listRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/reading-list",
        validateSearch: (search) => readingListSearchSchema.parse(search),
        component: () => <Story />,
      });
      const detailRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/reading-list/$itemId",
      });
      storyRouter = createRouter({
        routeTree: rootRoute.addChildren([listRoute, detailRoute]),
        history: createMemoryHistory({ initialEntries: ["/reading-list"] }),
      });
      return <RouterProvider router={storyRouter} />;
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
export const SaveDisabledWhenEmpty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
  },
};

export const AddsItem: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Paste a URL to save");
    await userEvent.type(input, "https://example.com/new");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(async () => {
      await expect(args.addItem).toHaveBeenCalledWith({
        url: "https://example.com/new",
      });
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText("Status"), "reading");
    await waitFor(() =>
      expect(storyRouter.state.location.search).toMatchObject({
        status: "reading",
        page: 1,
      }),
    );
  },
};

export const SortsByDate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByLabelText("Sort"), "asc");
    await waitFor(() =>
      expect(storyRouter.state.location.search).toMatchObject({
        order: "asc",
        page: 1,
      }),
    );
  },
};

export const GoesToNextPage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("link", { name: "Next" }));
    await waitFor(() =>
      expect(storyRouter.state.location.search).toMatchObject({ page: 2 }),
    );
  },
};
