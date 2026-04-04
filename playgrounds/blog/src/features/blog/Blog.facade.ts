import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { blogApi, type BlogPost, type CreateBlogInput } from "./Blog.api";

export interface BlogFacade {
  blogs: BlogPost[];
  isPending: boolean;
  isFetching: boolean;
  addBlog: (input: CreateBlogInput) => Promise<void>;
}

export interface BlogDetailFacade {
  blog: BlogPost | undefined;
  isPending: boolean;
  isFetching: boolean;
}

const blogKeys = {
  all: ["blogs"] as const,
  detail: (id: string) => ["blogs", id] as const,
};

export function useBlogFacade(): BlogFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching } = useQuery({
    queryKey: blogKeys.all,
    queryFn: blogApi.getAll,
    placeholderData: keepPreviousData,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateBlogInput) => blogApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: blogKeys.all });
      const previous = queryClient.getQueryData<BlogPost[]>(blogKeys.all);
      queryClient.setQueryData<BlogPost[]>(blogKeys.all, (old) => [
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
      queryClient.setQueryData(blogKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
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

export function useBlogDetailFacade(id: string): BlogDetailFacade {
  const { data, isPending, isFetching } = useQuery({
    queryKey: blogKeys.detail(id),
    queryFn: () => blogApi.getById(id),
    placeholderData: keepPreviousData,
  });

  return {
    blog: data,
    isPending,
    isFetching,
  };
}
