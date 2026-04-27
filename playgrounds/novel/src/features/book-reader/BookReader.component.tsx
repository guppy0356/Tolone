import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useBookReaderPresenter } from "./BookReader.presenter";
import type { BookReaderFacade } from "./BookReader.facade";
import type { Page } from "./BookReader.api";

export function BookReaderSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse p-6">
      <div className="mb-4 h-4 w-1/4 rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-5/6 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}

interface BookReaderViewProps {
  page: Page;
  bookId: string;
  pageNumber: number;
  setPageNumber: (n: number) => void;
}

const BookReaderView = memo(function BookReaderView({
  page,
  bookId,
  pageNumber,
  setPageNumber,
}: BookReaderViewProps) {
  const { canGoPrev, canGoNext, handlePrev, handleNext } =
    useBookReaderPresenter({
      pageNumber,
      totalPages: page.totalPages,
      setPageNumber,
    });

  return (
    <article className="mx-auto max-w-2xl p-6">
      <p className="mb-4 text-sm text-gray-500">
        Page {pageNumber} of {page.totalPages}
      </p>

      <p className="whitespace-pre-line leading-relaxed text-gray-800">
        {page.content}
      </p>

      <nav className="mt-8 flex justify-between">
        {canGoPrev ? (
          <button
            type="button"
            onClick={handlePrev}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            ← Previous
          </button>
        ) : (
          <Link
            to="/preview-books/$id"
            params={{ id: bookId }}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            ← Back to preview
          </Link>
        )}
        {canGoNext && (
          <button
            type="button"
            onClick={handleNext}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Next →
          </button>
        )}
      </nav>
    </article>
  );
});

export function BookReaderComponent({
  page,
  isPending,
  isFetching,
  bookId,
  pageNumber,
  setPageNumber,
}: BookReaderFacade) {
  if (isPending || !page) {
    return <BookReaderSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <BookReaderView
        page={page}
        bookId={bookId}
        pageNumber={pageNumber}
        setPageNumber={setPageNumber}
      />
    </div>
  );
}
