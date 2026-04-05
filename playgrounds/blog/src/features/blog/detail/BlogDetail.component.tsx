import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useBlogDetailPresenter } from "./BlogDetail.presenter";
import type { BlogDetailFacade } from "./BlogDetail.facade";
import { BlogSkeleton } from "../list/BlogSkeleton";

export const BlogDetail = memo(function BlogDetail({
  blog,
  isPending,
}: BlogDetailFacade) {
  const { formattedDate } = useBlogDetailPresenter({ blog });

  if (isPending) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <BlogSkeleton />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <p className="text-gray-500">Blog post not found.</p>
        <Link to="/" className="text-blue-500 hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <Link to="/" className="mb-4 inline-block text-blue-500 hover:underline">
        Back to list
      </Link>
      <article>
        <h1 className="mb-2 text-2xl font-bold">{blog.title}</h1>
        <p className="mb-4 text-sm text-gray-500">{formattedDate}</p>
        {blog.content && (
          <div className="whitespace-pre-wrap">{blog.content}</div>
        )}
      </article>
    </div>
  );
});
