import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { ReadingItemDetailComponent } from "./ReadingItemDetail.component";
import type { ReadingItem } from "./ReadingItem.api";

const sampleDetail: ReadingItem = {
  id: "d1",
  url: "https://example.com/a-great-article",
  title: "A great article",
  thumbnailUrl: "https://picsum.photos/seed/d1/320/180",
  status: "unread",
  createdAt: "2026-06-20T09:00:00Z",
  note: "First pass notes to expand later.",
};

const meta = {
  title: "features/ReadingItemDetail",
  component: ReadingItemDetailComponent,
  args: {
    detail: sampleDetail,
    isPending: false,
    isRefetching: false,
    isNotFound: false,
    saveNote: fn(),
    changeStatus: fn(),
  },
  decorators: [
    (Story) => {
      const rootRoute = createRootRoute({ component: () => <Story /> });
      const listRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/reading-list",
      });
      const router = createRouter({
        routeTree: rootRoute.addChildren([listRoute]),
      });
      return <RouterProvider router={router} />;
    },
  ],
} satisfies Meta<typeof ReadingItemDetailComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Visual states ---
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("A great article")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Note")).toHaveValue(
      "First pass notes to expand later.",
    );
  },
};

export const ReadItem: Story = {
  args: { detail: { ...sampleDetail, status: "read" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Read" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvas.getByText(/can no longer be deleted/)).toBeInTheDocument();
  },
};

export const Skeleton: Story = {
  args: { isPending: true, detail: undefined },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  },
};

export const NotFound: Story = {
  args: { isNotFound: true, detail: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/could not be found/),
    ).toBeInTheDocument();
  },
};

// --- Interaction tests ---
export const SaveNoteDisabledUntilEdited: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Save note" }),
    ).toBeDisabled();
  },
};

export const SavesNote: Story = {
  args: { detail: { ...sampleDetail, note: "" } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByLabelText("Note");
    await userEvent.type(textarea, "Learned about query keys.");
    await userEvent.click(canvas.getByRole("button", { name: "Save note" }));
    await waitFor(async () => {
      await expect(args.saveNote).toHaveBeenCalledWith(
        "Learned about query keys.",
      );
    });
  },
};

export const MarksAsRead: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Read" }));
    await expect(args.changeStatus).toHaveBeenCalledWith("read");
  },
};
