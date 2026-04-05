import { getRouteApi } from "@tanstack/react-router";
import { useBlogDetailFacade } from "./BlogDetail.facade";
import { BlogDetail } from "./BlogDetail.component";

const route = getRouteApi("/blogs/$id");

export function BlogDetailContainer() {
  const { id } = route.useParams();
  const { blog, isPending, isFetching } = useBlogDetailFacade(id);

  return (
    <BlogDetail
      blog={blog}
      isPending={isPending}
      isFetching={isFetching}
    />
  );
}
