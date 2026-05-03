import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { bookReaderApi, type Book, type Page } from "./BookReader.api";

export interface BookReaderFacade {
  book: Book | undefined;
  page: Page | undefined;
  isPending: boolean;
  isFetching: boolean;
  bookId: string;
  pageNumber: number;
  goNext: () => Promise<void>;
  goPrev: () => Promise<void>;
}

const bookReaderKeys = {
  detail: (id: string) => ["books", id] as const,
};

export function useBookReaderFacade(bookId: string): BookReaderFacade {
  const queryClient = useQueryClient();
  const detailKey = bookReaderKeys.detail(bookId);

  const bookQuery = useQuery({
    queryKey: detailKey,
    queryFn: () => bookReaderApi.getBook(bookId),
  });

  const book = bookQuery.data;
  const pageNumber = book?.currentPage ?? 1;
  const page: Page | undefined = book
    ? { number: book.currentPage, totalPages: book.totalPages, content: book.pageContent }
    : undefined;

  const optimisticUpdate = (direction: "next" | "prev") => async () => {
    await queryClient.cancelQueries({ queryKey: detailKey });
    const previous = queryClient.getQueryData<Book>(detailKey);
    if (previous) {
      const current = previous.currentPage;
      const optimistic =
        direction === "next"
          ? Math.min(current + 1, previous.totalPages)
          : Math.max(current - 1, 1);
      queryClient.setQueryData<Book>(detailKey, {
        ...previous,
        currentPage: optimistic,
      });
    }
    return { previous };
  };

  const onError = (
    _err: unknown,
    _vars: void,
    context: { previous: Book | undefined } | undefined,
  ) => {
    if (context?.previous) {
      queryClient.setQueryData(detailKey, context.previous);
    }
  };

  const onSuccess = (data: { page: number; content: string; totalPages: number }) => {
    const current = queryClient.getQueryData<Book>(detailKey);
    if (current) {
      queryClient.setQueryData<Book>(detailKey, {
        ...current,
        currentPage: data.page,
        pageContent: data.content,
      });
    }
  };

  const nextMutation = useMutation({
    mutationFn: () => bookReaderApi.nextPage(bookId),
    onMutate: optimisticUpdate("next"),
    onError,
    onSuccess,
  });

  const prevMutation = useMutation({
    mutationFn: () => bookReaderApi.prevPage(bookId),
    onMutate: optimisticUpdate("prev"),
    onError,
    onSuccess,
  });

  const goNext = useCallback(async () => {
    await nextMutation.mutateAsync();
  }, [nextMutation]);

  const goPrev = useCallback(async () => {
    await prevMutation.mutateAsync();
  }, [prevMutation]);

  return {
    book,
    page,
    isPending: bookQuery.isPending,
    isFetching: bookQuery.isFetching,
    bookId,
    pageNumber,
    goNext,
    goPrev,
  };
}
