import { memo } from "react";
import { useBlogFormPresenter } from "./BlogForm.presenter";
import type { BlogFacade } from "./Blog.facade";

export const BlogForm = memo(function BlogForm({
  addBlog,
}: Pick<BlogFacade, "addBlog">) {
  const { titleField, contentField, handleSubmit, isValid } =
    useBlogFormPresenter({ addBlog });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="mb-6 space-y-3"
    >
      <div>
        <input
          type="text"
          value={titleField.value}
          onChange={(e) => titleField.onChange(e.target.value)}
          onBlur={titleField.onBlur}
          placeholder="Blog title"
          className="w-full rounded border px-3 py-2"
        />
        {titleField.error && (
          <p className="mt-1 text-sm text-red-500">{titleField.error}</p>
        )}
      </div>

      <div>
        <textarea
          value={contentField.value}
          onChange={(e) => contentField.onChange(e.target.value)}
          onBlur={contentField.onBlur}
          placeholder="Write your content... (optional)"
          rows={4}
          className="w-full rounded border px-3 py-2"
        />
        {contentField.error && (
          <p className="mt-1 text-sm text-red-500">{contentField.error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
      >
        Post
      </button>
    </form>
  );
});
