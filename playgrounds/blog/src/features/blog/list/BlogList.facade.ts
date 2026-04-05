import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { blogApi, type BlogPost, type CreateBlogInput } from "../Blog.api";

export interface BlogListFacade {
  blogs: BlogPost[];
  isPending: boolean;
  isFetching: boolean;
  addBlog: (input: CreateBlogInput) => Promise<void>;
}

export function useBlogListFacade(): BlogListFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["blogs"],
    queryFn: blogApi.getAll,
    placeholderData: keepPreviousData,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateBlogInput) => blogApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["blogs"] });
      const previous = queryClient.getQueryData<BlogPost[]>(["blogs"]);
      queryClient.setQueryData<BlogPost[]>(["blogs"], (old) => [
        ...(old ?? []),
        {
          id: crypto.randomUUID(),
          title: input.title,
          content: input.content ?? "",
          createdAt: new Date().toISOString(),
        },
      ]);
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(["blogs"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });

  const addBlog = useCallback(
    async (input: CreateBlogInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation.mutateAsync],
  );

  return {
    blogs: data ?? [],
    isPending,
    isFetching,
    addBlog,
  };
}
