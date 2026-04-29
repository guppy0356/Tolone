import { useCallback } from "react";

export interface BookReaderPresenterProps {
  pageNumber: number;
  totalPages: number;
  goNext: () => Promise<void>;
  goPrev: () => Promise<void>;
}

export interface BookReaderPresenter {
  canGoPrev: boolean;
  canGoNext: boolean;
  handlePrev: () => Promise<void>;
  handleNext: () => Promise<void>;
}

export function useBookReaderPresenter({
  pageNumber,
  totalPages,
  goNext,
  goPrev,
}: BookReaderPresenterProps): BookReaderPresenter {
  const canGoPrev = pageNumber > 1;
  const canGoNext = pageNumber < totalPages;

  const handlePrev = useCallback(async () => {
    if (!canGoPrev) return;
    await goPrev();
  }, [canGoPrev, goPrev]);

  const handleNext = useCallback(async () => {
    if (!canGoNext) return;
    await goNext();
  }, [canGoNext, goNext]);

  return {
    canGoPrev,
    canGoNext,
    handlePrev,
    handleNext,
  };
}
