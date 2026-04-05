import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { BlogPost } from "../Blog.api";

export interface BlogListProps {
  blogs: BlogPost[];
  isFetching: boolean;
}

export const BlogList = memo(function BlogList({
  blogs,
  isFetching,
}: BlogListProps) {
  if (blogs.length === 0) {
    return <p className="text-gray-500">No blog posts yet.</p>;
  }

  return (
    <ul
      className={`space-y-2 transition-opacity ${isFetching ? "opacity-50" : ""}`}
    >
      {blogs.map((blog) => (
        <li key={blog.id}>
          <Link
            to="/blogs/$id"
            params={{ id: blog.id }}
            className="block rounded border p-4 hover:bg-gray-50"
          >
            <h3 className="font-semibold">{blog.title}</h3>
            <p className="text-sm text-gray-500">
              {new Date(blog.createdAt).toLocaleDateString()}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
});
