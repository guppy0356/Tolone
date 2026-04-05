import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { blogApi, type BlogPost } from "../Blog.api";

export interface BlogDetailFacade {
  blog: BlogPost | undefined;
  isPending: boolean;
  isFetching: boolean;
}

export function useBlogDetailFacade(id: string): BlogDetailFacade {
  const { data, isPending, isFetching } = useQuery({
    queryKey: ["blogs", id],
    queryFn: () => blogApi.getById(id),
    placeholderData: keepPreviousData,
  });

  return {
    blog: data,
    isPending,
    isFetching,
  };
}
