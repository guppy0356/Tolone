import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { BookPreviewFacade } from "./BookPreview.facade";
import type { BookPreview } from "./BookPreview.api";

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
  book: BookPreview;
  bookId: string;
  isLoggedIn: boolean;
}

const BookPreviewView = memo(function BookPreviewView({
  book,
  bookId,
  isLoggedIn,
}: BookPreviewViewProps) {
  return (
    <article className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-3xl font-bold">{book.title}</h1>
      <p className="mb-6 text-sm text-gray-600">by {book.author}</p>
      <p className="mb-8 leading-relaxed text-gray-700">{book.summary}</p>

      <div className="text-center">
        {isLoggedIn ? (
          <Link
            to="/books/$id"
            params={{ id: bookId }}
            className="inline-block rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
          >
            Read the full book
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-block rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
          >
            Log in to read
          </Link>
        )}
      </div>
    </article>
  );
});

export interface BookPreviewComponentProps extends BookPreviewFacade {
  isLoggedIn: boolean;
}

export function BookPreviewComponent({
  book,
  isPending,
  isFetching,
  bookId,
  isLoggedIn,
}: BookPreviewComponentProps) {
  if (isPending || !book) {
    return <BookPreviewSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <BookPreviewView book={book} bookId={bookId} isLoggedIn={isLoggedIn} />
    </div>
  );
}
