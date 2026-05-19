import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { BlogForm } from "./BlogForm.component";

const meta = {
  title: "features/BlogForm",
  component: BlogForm,
  args: { addBlog: fn() },
} satisfies Meta<typeof BlogForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PostDisabledWhenEmpty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Post" }),
    ).toBeDisabled();
  },
};

export const PostEnabledWhenTitleFilled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("Blog title"),
      "My post",
    );
    await expect(
      canvas.getByRole("button", { name: "Post" }),
    ).toBeEnabled();
  },
};

export const SubmitsWithTitleOnly: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("Blog title"),
      "My post",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Post" }));
    await waitFor(async () => {
      await expect(args.addBlog).toHaveBeenCalledWith({
        title: "My post",
        content: undefined,
      });
    });
  },
};

export const SubmitsWithTitleAndContent: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("Blog title"),
      "My post",
    );
    await userEvent.type(
      canvas.getByPlaceholderText("Write your content... (optional)"),
      "Some content",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Post" }));
    await waitFor(async () => {
      await expect(args.addBlog).toHaveBeenCalledWith({
        title: "My post",
        content: "Some content",
      });
    });
  },
};

export const ClearsFormAfterSubmit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const titleInput = canvas.getByPlaceholderText(
      "Blog title",
    ) as HTMLInputElement;
    await userEvent.type(titleInput, "My post");
    await userEvent.click(canvas.getByRole("button", { name: "Post" }));
    await waitFor(async () => {
      await expect(titleInput).toHaveValue("");
    });
  },
};

export const ValidatesTitleMaxLength: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("Blog title"),
      "a".repeat(31),
    );
    await userEvent.click(document.body);
    await expect(
      await canvas.findByText("Title must be 30 characters or less"),
    ).toBeInTheDocument();
  },
};

export const ValidatesContentMaxLength: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByPlaceholderText("Blog title"),
      "Valid title",
    );
    await userEvent.type(
      canvas.getByPlaceholderText("Write your content... (optional)"),
      "a".repeat(501),
    );
    await userEvent.click(document.body);
    await expect(
      await canvas.findByText("Content must be 500 characters or less"),
    ).toBeInTheDocument();
  },
};
