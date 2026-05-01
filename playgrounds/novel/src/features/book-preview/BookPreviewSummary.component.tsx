import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { BookPreviewFacade } from "./BookPreview.facade";
import type { BookPreview } from "./BookPreview.api";

export function BookPreviewSummarySkeleton() {
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

interface BookPreviewSummaryViewProps {
  book: BookPreview;
  bookId: string;
}

const BookPreviewSummaryView = memo(function BookPreviewSummaryView({
  book,
  bookId,
}: BookPreviewSummaryViewProps) {
  return (
    <article className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-3xl font-bold">{book.title}</h1>
      <p className="mb-6 text-sm text-gray-600">by {book.author}</p>
      <p className="mb-8 leading-relaxed text-gray-700">{book.summary}</p>
      <Link
        to="/preview-books/$id/read"
        params={{ id: bookId }}
        className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
      >
        Start reading →
      </Link>
    </article>
  );
});

export interface BookPreviewSummaryComponentProps
  extends Pick<BookPreviewFacade, "book" | "isPending" | "isFetching"> {
  bookId: string;
}

export function BookPreviewSummaryComponent({
  book,
  isPending,
  isFetching,
  bookId,
}: BookPreviewSummaryComponentProps) {
  if (isPending || !book) {
    return <BookPreviewSummarySkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <BookPreviewSummaryView book={book} bookId={bookId} />
    </div>
  );
}
