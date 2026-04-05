import { useBlogFacade } from "../Blog.facade";
import { BlogPage } from "./BlogPage";

export function BlogListContainer() {
  const { blogs, isPending, isFetching, addBlog } = useBlogFacade();

  return (
    <BlogPage
      blogs={blogs}
      isPending={isPending}
      isFetching={isFetching}
      addBlog={addBlog}
    />
  );
}
