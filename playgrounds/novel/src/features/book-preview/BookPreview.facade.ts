import { useCallback, useState } from "react";
import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { bookPreviewApi, type Book, type Page } from "./BookPreview.api";

export const PREVIEW_PAGE_LIMIT = 3;

export interface BookPreviewFacade {
  book: Book | undefined;
  page: Page | undefined;
  isPending: boolean;
  isFetching: boolean;
  bookId: string;
  currentPage: number;
  setCurrentPage: (n: number) => void;
}

const bookPreviewKeys = {
  detail: (id: string) => ["books", id] as const,
  page: (id: string, n: number) => ["books", id, "pages", n] as const,
};

export function useBookPreviewFacade(id: string): BookPreviewFacade {
  const [currentPage, setCurrentPageState] = useState(1);

  const setCurrentPage = useCallback((n: number) => {
    setCurrentPageState(Math.max(1, Math.min(PREVIEW_PAGE_LIMIT + 1, n)));
  }, []);

  const bookQuery = useQuery({
    queryKey: bookPreviewKeys.detail(id),
    queryFn: () => bookPreviewApi.getBook(id),
    placeholderData: keepPreviousData,
  });

  const wantsContent = currentPage <= PREVIEW_PAGE_LIMIT;

  const pageQuery = useQuery({
    queryKey: bookPreviewKeys.page(id, currentPage),
    queryFn: () => bookPreviewApi.getPage(id, currentPage),
    placeholderData: keepPreviousData,
    enabled: wantsContent,
  });

  return {
    book: bookQuery.data,
    page: wantsContent ? pageQuery.data : undefined,
    isPending: bookQuery.isPending || (wantsContent && pageQuery.isPending),
    isFetching: bookQuery.isFetching || pageQuery.isFetching,
    bookId: id,
    currentPage,
    setCurrentPage,
  };
}
