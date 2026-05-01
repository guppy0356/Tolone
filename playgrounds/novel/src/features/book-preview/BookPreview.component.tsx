import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useBookPreviewPresenter } from "./BookPreview.presenter";
import type { BookPreviewFacade } from "./BookPreview.facade";
import type { BookPreview, Page } from "./BookPreview.api";

export function BookPreviewSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse p-6">
      <div className="mb-4 h-4 w-1/4 rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-5/6 rounded bg-gray-200" />
      </div>
    </div>
  );
}

interface BookPreviewViewProps {
  book: BookPreview;
  page: Page | undefined;
  bookId: string;
  currentPage: number;
  setCurrentPage: (n: number) => void;
  isLoggedIn: boolean;
}

const BookPreviewView = memo(function BookPreviewView({
  book,
  page,
  bookId,
  currentPage,
  setCurrentPage,
  isLoggedIn,
}: BookPreviewViewProps) {
  const { showCta, canGoPrev, canGoNext, handlePrev, handleNext } =
    useBookPreviewPresenter({ currentPage, setCurrentPage });

  return (
    <article className="mx-auto max-w-2xl p-6">
      {showCta || !page ? (
        <div className="rounded border border-amber-300 bg-amber-50 p-6 text-center">
          <p className="mb-4 text-amber-800">
            You've reached the end of the preview.
          </p>
          {isLoggedIn ? (
            <Link
              to="/books/$id"
              params={{ id: bookId }}
              className="inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Read the full book
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Log in to keep reading
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            Preview · Page {currentPage} of {book.totalPages}
          </p>
          <p className="whitespace-pre-line leading-relaxed text-gray-800">
            {page.content}
          </p>
        </>
      )}

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
            ← Back to summary
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

      {isLoggedIn && !showCta && (
        <div className="mt-8 border-t pt-4 text-center">
          <Link
            to="/books/$id"
            params={{ id: bookId }}
            className="text-sm text-blue-600 hover:underline"
          >
            Skip preview · Read the full book →
          </Link>
        </div>
      )}
    </article>
  );
});

export interface BookPreviewComponentProps
  extends Pick<
    BookPreviewFacade,
    "book" | "page" | "isPending" | "isFetching" | "bookId" | "currentPage" | "setCurrentPage"
  > {
  isLoggedIn: boolean;
}

export function BookPreviewComponent({
  book,
  page,
  isPending,
  isFetching,
  bookId,
  currentPage,
  setCurrentPage,
  isLoggedIn,
}: BookPreviewComponentProps) {
  if (isPending || !book) {
    return <BookPreviewSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <BookPreviewView
        book={book}
        page={page}
        bookId={bookId}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
