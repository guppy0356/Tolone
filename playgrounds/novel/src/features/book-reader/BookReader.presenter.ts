export interface BookReaderPresenterProps {
  pageNumber: number;
  totalPages: number;
}

export interface BookReaderPresenter {
  prevSearch: { page: number } | null;
  nextSearch: { page: number } | null;
}

export function useBookReaderPresenter({
  pageNumber,
  totalPages,
}: BookReaderPresenterProps): BookReaderPresenter {
  const prevSearch = pageNumber > 1 ? { page: pageNumber - 1 } : null;
  const nextSearch = pageNumber < totalPages ? { page: pageNumber + 1 } : null;

  return {
    prevSearch,
    nextSearch,
  };
}
