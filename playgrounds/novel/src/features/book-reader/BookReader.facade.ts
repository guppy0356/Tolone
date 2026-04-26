import {
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { bookReaderApi, type Page } from "./BookReader.api";

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

export function useBookReaderFacade(
  bookId: string,
  pageNumber: number,
): BookReaderFacade {
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
