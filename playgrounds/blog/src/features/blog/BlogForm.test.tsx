import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { BlogForm } from "./BlogForm.component";

describe("BlogForm", () => {
  it("disables submit button when title is empty", () => {
    render(<BlogForm addBlog={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Post" })).toBeDisabled();
  });

  it("enables submit button when title is filled", async () => {
    const user = userEvent.setup();
    render(<BlogForm addBlog={vi.fn()} />);
    await user.type(screen.getByPlaceholderText("Blog title"), "My post");
    expect(screen.getByRole("button", { name: "Post" })).toBeEnabled();
  });

  it("submits with title only", async () => {
    const addBlog = vi.fn();
    const user = userEvent.setup();
    render(<BlogForm addBlog={addBlog} />);
    await user.type(screen.getByPlaceholderText("Blog title"), "My post");
    await user.click(screen.getByRole("button", { name: "Post" }));
    expect(addBlog).toHaveBeenCalledWith({
      title: "My post",
      content: undefined,
    });
  });

  it("submits with title and content", async () => {
    const addBlog = vi.fn();
    const user = userEvent.setup();
    render(<BlogForm addBlog={addBlog} />);
    await user.type(screen.getByPlaceholderText("Blog title"), "My post");
    await user.type(
      screen.getByPlaceholderText("Write your content... (optional)"),
      "Some content",
    );
    await user.click(screen.getByRole("button", { name: "Post" }));
    expect(addBlog).toHaveBeenCalledWith({
      title: "My post",
      content: "Some content",
    });
  });

  it("clears form after submit", async () => {
    const addBlog = vi.fn();
    const user = userEvent.setup();
    render(<BlogForm addBlog={addBlog} />);
    const titleInput = screen.getByPlaceholderText("Blog title");
    await user.type(titleInput, "My post");
    await user.click(screen.getByRole("button", { name: "Post" }));
    await waitFor(() => {
      expect(titleInput).toHaveValue("");
    });
  });

  it("shows validation error when title exceeds 30 characters", async () => {
    const user = userEvent.setup();
    render(<BlogForm addBlog={vi.fn()} />);
    await user.type(
      screen.getByPlaceholderText("Blog title"),
      "a".repeat(31),
    );
    await user.click(document.body); // trigger blur
    expect(
      await screen.findByText("Title must be 30 characters or less"),
    ).toBeInTheDocument();
  });

  it("shows validation error when content exceeds 500 characters", async () => {
    const user = userEvent.setup();
    render(<BlogForm addBlog={vi.fn()} />);
    await user.type(screen.getByPlaceholderText("Blog title"), "Valid title");
    await user.type(
      screen.getByPlaceholderText("Write your content... (optional)"),
      "a".repeat(501),
    );
    await user.click(document.body);
    expect(
      await screen.findByText("Content must be 500 characters or less"),
    ).toBeInTheDocument();
  });
});
