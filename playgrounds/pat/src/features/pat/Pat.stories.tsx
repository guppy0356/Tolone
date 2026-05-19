import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PatComponent, PatSkeleton } from "./Pat.component";
import type { Pat } from "./Pat.api";

const seededPats: Pat[] = [
  { id: "pat_1", title: "Personal laptop", createdAt: "2026-01-12T09:00:00Z" },
  { id: "pat_2", title: "CI runner", createdAt: "2026-01-22T14:30:00Z" },
  { id: "pat_3", title: "Mobile dev", createdAt: "2026-02-03T18:15:00Z" },
  { id: "pat_4", title: "Read-only audit", createdAt: "2026-02-19T11:45:00Z" },
  { id: "pat_5", title: "Backup script", createdAt: "2026-03-08T07:22:00Z" },
];

const meta = {
  title: "features/Pat",
  component: PatComponent,
  args: {
    pats: seededPats,
    isPending: false,
    isFetching: false,
    addPat: fn(),
    updatePat: fn(),
    deletePat: fn(),
  },
} satisfies Meta<typeof PatComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const pat of seededPats) {
      await expect(canvas.getByText(pat.title)).toBeInTheDocument();
    }
  },
};

export const Empty: Story = {
  args: { pats: [] },
};

export const Skeleton: StoryObj = {
  render: () => <PatSkeleton />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("Personal laptop")).not.toBeInTheDocument();
    await expect(canvas.getByPlaceholderText("Token name")).toBeDisabled();
  },
};

export const TrimsTitleOnCreate: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("Token name"),
      "  New token  ",
    );
    await userEvent.click(canvas.getByText("Generate token"));
    await expect(args.addPat).toHaveBeenCalledWith({ title: "New token" });
  },
};

export const ShowsCreateErrorOnReject: Story = {
  args: {
    addPat: fn(() => Promise.reject(new Error("boom"))),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("Token name"), "Test");
    await userEvent.click(canvas.getByText("Generate token"));
    await expect(
      await canvas.findByText("Failed to create token"),
    ).toBeInTheDocument();
  },
};

export const DismissesCreateError: Story = {
  args: {
    addPat: fn(() => Promise.reject(new Error("boom"))),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("Token name"), "Test");
    await userEvent.click(canvas.getByText("Generate token"));
    await canvas.findByText("Failed to create token");
    await userEvent.click(canvas.getByLabelText("Dismiss create error"));
    await expect(
      canvas.queryByText("Failed to create token"),
    ).not.toBeInTheDocument();
  },
};

export const EditsPatTitle: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Edit Personal laptop"));
    const input = canvas.getByLabelText("Edit title for Personal laptop");
    await userEvent.clear(input);
    await userEvent.type(input, "Renamed laptop");
    await userEvent.click(canvas.getByText("Save"));
    await expect(args.updatePat).toHaveBeenCalledWith("pat_1", {
      title: "Renamed laptop",
    });
  },
};

export const ShowsRowErrorOnUpdateReject: Story = {
  args: {
    updatePat: fn(() => Promise.reject(new Error("boom"))),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Edit Personal laptop"));
    await userEvent.click(canvas.getByText("Save"));
    await expect(
      await canvas.findByText("Failed to update token"),
    ).toBeInTheDocument();
  },
};

export const DeletesPat: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const deleteButtons = canvas.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);
    await expect(args.deletePat).toHaveBeenCalledWith("pat_1");
  },
};

export const ShowsRowErrorOnDeleteReject: Story = {
  args: {
    deletePat: fn(() => Promise.reject(new Error("boom"))),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const deleteButtons = canvas.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);
    await expect(
      await canvas.findByText("Failed to delete token"),
    ).toBeInTheDocument();
  },
};

export const DismissesRowError: Story = {
  args: {
    deletePat: fn(() => Promise.reject(new Error("boom"))),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const deleteButtons = canvas.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);
    await canvas.findByText("Failed to delete token");
    await userEvent.click(
      canvas.getByLabelText("Dismiss error for Personal laptop"),
    );
    await expect(
      canvas.queryByText("Failed to delete token"),
    ).not.toBeInTheDocument();
  },
};
