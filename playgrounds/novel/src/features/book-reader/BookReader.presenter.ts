export interface BookReaderPresenterProps {
  bookId: string;
  pageNumber: number;
  totalPages: number;
}

export interface BookReaderPresenter {
  prevToParams: { id: string; page: number } | null;
  nextToParams: { id: string; page: number } | null;
}

export function useBookReaderPresenter({
  bookId,
  pageNumber,
  totalPages,
}: BookReaderPresenterProps): BookReaderPresenter {
  const prevToParams =
    pageNumber > 1 ? { id: bookId, page: pageNumber - 1 } : null;

  const nextToParams =
    pageNumber < totalPages ? { id: bookId, page: pageNumber + 1 } : null;

  return {
    prevToParams,
    nextToParams,
  };
}
