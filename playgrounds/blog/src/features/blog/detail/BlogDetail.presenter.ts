import type { BlogPost } from "../Blog.api";

export interface BlogDetailPresenterProps {
  blog: BlogPost | undefined;
}

export interface BlogDetailPresenter {
  formattedDate: string;
}

export function useBlogDetailPresenter({
  blog,
}: BlogDetailPresenterProps): BlogDetailPresenter {
  const formattedDate = blog
    ? new Date(blog.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return { formattedDate };
}
