import { useCallback } from "react";
import { PREVIEW_PAGE_LIMIT } from "./BookPreview.facade";

export interface BookPreviewPresenterProps {
  currentPage: number;
  setCurrentPage: (n: number) => void;
}

export interface BookPreviewPresenter {
  showCta: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  handlePrev: () => void;
  handleNext: () => void;
}

export function useBookPreviewPresenter({
  currentPage,
  setCurrentPage,
}: BookPreviewPresenterProps): BookPreviewPresenter {
  const showCta = currentPage > PREVIEW_PAGE_LIMIT;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage <= PREVIEW_PAGE_LIMIT;

  const handlePrev = useCallback(() => {
    setCurrentPage(currentPage - 1);
  }, [currentPage, setCurrentPage]);

  const handleNext = useCallback(() => {
    setCurrentPage(currentPage + 1);
  }, [currentPage, setCurrentPage]);

  return { showCta, canGoPrev, canGoNext, handlePrev, handleNext };
}
