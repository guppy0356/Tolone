export interface BookPreviewPresenterProps {
  bookId: string;
}

export interface BookPreviewPresenter {
  readToParams: { id: string; page: number };
}

export function useBookPreviewPresenter({
  bookId,
}: BookPreviewPresenterProps): BookPreviewPresenter {
  return {
    readToParams: { id: bookId, page: 1 },
  };
}
