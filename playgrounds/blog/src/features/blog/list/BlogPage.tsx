import type { BlogListFacade } from "./BlogList.facade";
import { BlogForm } from "./BlogForm.component";
import { BlogList } from "./BlogList.component";
import { BlogSkeleton } from "./BlogSkeleton";

export function BlogPage({
  blogs,
  isPending,
  isFetching,
  addBlog,
}: BlogListFacade) {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">Blog</h1>

      <BlogForm addBlog={addBlog} />

      {isPending ? (
        <BlogSkeleton />
      ) : (
        <BlogList blogs={blogs} isFetching={isFetching} />
      )}
    </div>
  );
}
