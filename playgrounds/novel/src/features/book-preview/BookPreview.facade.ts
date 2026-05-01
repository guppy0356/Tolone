import { useQuery } from "@tanstack/react-query";
import { bookPreviewApi, type BookPreview } from "./BookPreview.api";

export interface BookPreviewFacade {
  book: BookPreview | undefined;
  isPending: boolean;
  isFetching: boolean;
  bookId: string;
}

const bookPreviewKeys = {
  detail: (id: string) => ["book-preview", id] as const,
};

export function useBookPreviewFacade(id: string): BookPreviewFacade {
  const { data, isPending, isFetching } = useQuery({
    queryKey: bookPreviewKeys.detail(id),
    queryFn: () => bookPreviewApi.getPreview(id),
  });

  return {
    book: data,
    isPending,
    isFetching,
    bookId: id,
  };
}
