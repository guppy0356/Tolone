import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { bookPreviewApi, type Book } from "./BookPreview.api";

export interface BookPreviewFacade {
  book: Book | undefined;
  isPending: boolean;
  isFetching: boolean;
}

const bookPreviewKeys = {
  detail: (id: string) => ["books", id] as const,
};

export function useBookPreviewFacade(id: string): BookPreviewFacade {
  const { data, isPending, isFetching } = useQuery({
    queryKey: bookPreviewKeys.detail(id),
    queryFn: () => bookPreviewApi.getBook(id),
    placeholderData: keepPreviousData,
  });

  return {
    book: data,
    isPending,
    isFetching,
  };
}
