import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { bookReaderApi, type Page } from "./BookReader.api";

const route = getRouteApi("/books/$id");

export interface BookReaderFacade {
  page: Page | undefined;
  isPending: boolean;
  isFetching: boolean;
  bookId: string;
  pageNumber: number;
}

const bookReaderKeys = {
  page: (bookId: string, pageNumber: number) =>
    ["books", bookId, "pages", pageNumber] as const,
};

export function useBookReaderFacade(bookId: string): BookReaderFacade {
  const { page: pageNumber } = route.useSearch();

  const { data, isPending, isFetching } = useQuery({
    queryKey: bookReaderKeys.page(bookId, pageNumber),
    queryFn: () => bookReaderApi.getPage(bookId, pageNumber),
    placeholderData: keepPreviousData,
  });

  return {
    page: data,
    isPending,
    isFetching,
    bookId,
    pageNumber,
  };
}
