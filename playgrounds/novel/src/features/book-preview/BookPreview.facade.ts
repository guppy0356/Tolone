import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  bookPreviewApi,
  type BookPreview,
  type Page,
} from "./BookPreview.api";

export const PREVIEW_PAGE_LIMIT = 3;

export interface BookPreviewFacade {
  book: BookPreview | undefined;
  page: Page | undefined;
  isPending: boolean;
  isFetching: boolean;
  bookId: string;
  currentPage: number;
  setCurrentPage: (n: number) => void;
}

const bookPreviewKeys = {
  detail: (id: string) => ["book-preview", id] as const,
};

export function useBookPreviewFacade(id: string): BookPreviewFacade {
  const [currentPage, setCurrentPageState] = useState(1);

  const setCurrentPage = useCallback((n: number) => {
    setCurrentPageState(Math.max(1, Math.min(PREVIEW_PAGE_LIMIT + 1, n)));
  }, []);

  const { data, isPending, isFetching } = useQuery({
    queryKey: bookPreviewKeys.detail(id),
    queryFn: () => bookPreviewApi.getPreview(id),
  });

  const page =
    currentPage <= PREVIEW_PAGE_LIMIT
      ? data?.pages[currentPage - 1]
      : undefined;

  return {
    book: data,
    page,
    isPending,
    isFetching,
    bookId: id,
    currentPage,
    setCurrentPage,
  };
}
