export interface BookReaderPresenterProps {
  bookId: string;
  pageNumber: number;
  totalPages: number;
  isLoggedIn: boolean;
}

export interface BookReaderPresenter {
  showGate: boolean;
  prevToParams: { id: string; page: number } | null;
  nextToParams: { id: string; page: number } | null;
}

export function useBookReaderPresenter({
  bookId,
  pageNumber,
  totalPages,
  isLoggedIn,
}: BookReaderPresenterProps): BookReaderPresenter {
  const showGate = !isLoggedIn && pageNumber === 3;

  const prevToParams =
    pageNumber > 1 ? { id: bookId, page: pageNumber - 1 } : null;

  const nextToParams =
    pageNumber < totalPages ? { id: bookId, page: pageNumber + 1 } : null;

  return {
    showGate,
    prevToParams,
    nextToParams,
  };
}
