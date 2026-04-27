import { useCallback } from "react";

export interface BookReaderPresenterProps {
  pageNumber: number;
  totalPages: number;
  setPageNumber: (n: number) => void;
}

export interface BookReaderPresenter {
  canGoPrev: boolean;
  canGoNext: boolean;
  handlePrev: () => void;
  handleNext: () => void;
}

export function useBookReaderPresenter({
  pageNumber,
  totalPages,
  setPageNumber,
}: BookReaderPresenterProps): BookReaderPresenter {
  const canGoPrev = pageNumber > 1;
  const canGoNext = pageNumber < totalPages;

  const handlePrev = useCallback(() => {
    setPageNumber(pageNumber - 1);
  }, [pageNumber, setPageNumber]);

  const handleNext = useCallback(() => {
    setPageNumber(pageNumber + 1);
  }, [pageNumber, setPageNumber]);

  return {
    canGoPrev,
    canGoNext,
    handlePrev,
    handleNext,
  };
}
