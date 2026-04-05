import { useBlogListFacade } from "./BlogList.facade";
import { BlogPage } from "./BlogPage";

export function BlogListContainer() {
  const { blogs, isPending, isFetching, addBlog } = useBlogListFacade();

  return (
    <BlogPage
      blogs={blogs}
      isPending={isPending}
      isFetching={isFetching}
      addBlog={addBlog}
    />
  );
}
