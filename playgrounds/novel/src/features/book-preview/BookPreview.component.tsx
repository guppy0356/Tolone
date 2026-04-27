import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useBookPreviewPresenter } from "./BookPreview.presenter";
import type { BookPreviewFacade } from "./BookPreview.facade";
import type { Book, Page } from "./BookPreview.api";

export function BookPreviewSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse p-6">
      <div className="mb-3 h-8 w-2/3 rounded bg-gray-200" />
      <div className="mb-6 h-4 w-1/3 rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-4/5 rounded bg-gray-200" />
      </div>
    </div>
  );
}

interface BookPreviewViewProps {
  book: Book;
  page: Page | undefined;
  bookId: string;
  currentPage: number;
  isLoggedIn: boolean;
  flash: "login-required" | undefined;
}

const BookPreviewView = memo(function BookPreviewView({
  book,
  page,
  bookId,
  currentPage,
  isLoggedIn,
  flash,
}: BookPreviewViewProps) {
  const { showCta, prevSearch, nextSearch, readParams, readSearch } =
    useBookPreviewPresenter({ bookId, currentPage });

  return (
    <article className="mx-auto max-w-2xl p-6">
      {flash === "login-required" && (
        <div
          role="alert"
          className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          You need to log in to keep reading.
        </div>
      )}

      <header className="mb-6">
        <h1 className="mb-1 text-3xl font-bold">{book.title}</h1>
        <p className="text-sm text-gray-600">by {book.author}</p>
        {currentPage === 1 && (
          <p className="mt-3 text-gray-700">{book.summary}</p>
        )}
      </header>

      {showCta || !page ? (
        <div className="rounded border border-amber-300 bg-amber-50 p-6 text-center">
          <p className="mb-4 text-amber-800">
            You've reached the end of the preview.
          </p>
          {isLoggedIn ? (
            <Link
              to="/books/$id"
              params={readParams}
              search={readSearch}
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
        {prevSearch ? (
          <Link
            to="/preview-books/$id"
            params={{ id: bookId }}
            search={prevSearch}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {nextSearch && (
          <Link
            to="/preview-books/$id"
            params={{ id: bookId }}
            search={nextSearch}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Next →
          </Link>
        )}
      </nav>

      {isLoggedIn && !showCta && (
        <div className="mt-8 border-t pt-4 text-center">
          <Link
            to="/books/$id"
            params={readParams}
            search={readSearch}
            className="text-sm text-blue-600 hover:underline"
          >
            Skip preview · Read the full book →
          </Link>
        </div>
      )}
    </article>
  );
});

export interface BookPreviewComponentProps extends BookPreviewFacade {
  flash: "login-required" | undefined;
  isLoggedIn: boolean;
}

export function BookPreviewComponent({
  book,
  page,
  isPending,
  isFetching,
  bookId,
  currentPage,
  flash,
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
        isLoggedIn={isLoggedIn}
        flash={flash}
      />
    </div>
  );
}
