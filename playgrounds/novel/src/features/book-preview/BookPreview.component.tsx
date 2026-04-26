import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useBookPreviewPresenter } from "./BookPreview.presenter";
import type { BookPreviewFacade } from "./BookPreview.facade";
import type { Book } from "./BookPreview.api";

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
  flash: "login-required" | undefined;
}

const BookPreviewView = memo(function BookPreviewView({
  book,
  flash,
}: BookPreviewViewProps) {
  const { readToParams } = useBookPreviewPresenter({ bookId: book.id });

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
      <h1 className="mb-1 text-3xl font-bold">{book.title}</h1>
      <p className="mb-4 text-sm text-gray-600">by {book.author}</p>
      <p className="mb-6 text-gray-800">{book.summary}</p>
      <p className="mb-6 text-sm text-gray-500">{book.totalPages} pages</p>
      <Link
        to="/books/$id/read/$page"
        params={readToParams}
        className="inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Read
      </Link>
    </article>
  );
});

export interface BookPreviewComponentProps extends BookPreviewFacade {
  flash: "login-required" | undefined;
}

export function BookPreviewComponent({
  book,
  isPending,
  isFetching,
  flash,
}: BookPreviewComponentProps) {
  if (isPending || !book) {
    return <BookPreviewSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <BookPreviewView book={book} flash={flash} />
    </div>
  );
}
