import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useBookReaderPresenter } from "./BookReader.presenter";
import type { BookReaderFacade } from "./BookReader.facade";
import type { Book, Page } from "./BookReader.api";

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
  book: Book;
  page: Page;
  bookId: string;
  pageNumber: number;
  goNext: () => Promise<void>;
  goPrev: () => Promise<void>;
}

const BookReaderView = memo(function BookReaderView({
  book,
  page,
  bookId,
  pageNumber,
  goNext,
  goPrev,
}: BookReaderViewProps) {
  const { canGoPrev, canGoNext, handlePrev, handleNext } =
    useBookReaderPresenter({
      pageNumber,
      totalPages: page.totalPages,
      goNext,
      goPrev,
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
  book,
  page,
  isPending,
  isFetching,
  bookId,
  pageNumber,
  goNext,
  goPrev,
}: BookReaderFacade) {
  if (isPending || !book || !page) {
    return <BookReaderSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <BookReaderView
        book={book}
        page={page}
        bookId={bookId}
        pageNumber={pageNumber}
        goNext={goNext}
        goPrev={goPrev}
      />
    </div>
  );
}
