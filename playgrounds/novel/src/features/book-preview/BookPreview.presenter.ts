import { PREVIEW_PAGE_LIMIT } from "./BookPreview.facade";

export interface BookPreviewPresenterProps {
  bookId: string;
  currentPage: number;
}

export interface BookPreviewPresenter {
  showCta: boolean;
  prevSearch: { page: number; flash: undefined } | null;
  nextSearch: { page: number; flash: undefined } | null;
  readToParams: { id: string; page: number };
}

export function useBookPreviewPresenter({
  bookId,
  currentPage,
}: BookPreviewPresenterProps): BookPreviewPresenter {
  const showCta = currentPage > PREVIEW_PAGE_LIMIT;

  const prevSearch =
    currentPage > 1
      ? { page: currentPage - 1, flash: undefined as undefined }
      : null;

  const nextSearch =
    currentPage <= PREVIEW_PAGE_LIMIT
      ? { page: currentPage + 1, flash: undefined as undefined }
      : null;

  return {
    showCta,
    prevSearch,
    nextSearch,
    readToParams: { id: bookId, page: 1 },
  };
}
