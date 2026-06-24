import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { ReadingItemDetailFacade } from "./ReadingItemDetail.facade";
import type { ReadingItem } from "./ReadingItem.api";
import {
  useReadingItemDetailPresenter,
  STATUS_OPTIONS,
} from "./ReadingItemDetail.presenter";

function BackLink() {
  return (
    <Link
      to="/reading-list"
      className="inline-block text-sm text-blue-600 hover:underline"
    >
      ← Back to list
    </Link>
  );
}

// Private memo'd body — receives the defined detail plus the stable note/status
// actions, then calls the Presenter (which also owns the note draft state).
const ReadingItemDetailBody = memo(function ReadingItemDetailBody({
  detail,
  saveNote,
  changeStatus,
}: {
  detail: ReadingItem;
  saveNote: ReadingItemDetailFacade["saveNote"];
  changeStatus: ReadingItemDetailFacade["changeStatus"];
}) {
  const {
    note,
    setNote,
    isNoteDirty,
    handleSaveNote,
    handleStatusChange,
    formattedCreatedAt,
  } = useReadingItemDetailPresenter({ detail, saveNote, changeStatus });

  return (
    <article className="space-y-6">
      <div className="flex gap-4">
        <img
          src={detail.thumbnailUrl}
          alt=""
          className="h-24 w-40 shrink-0 rounded bg-gray-100 object-cover"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900">
            {detail.title}
          </h1>
          <a
            href={detail.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block truncate text-sm text-blue-600 hover:underline"
          >
            {detail.url}
          </a>
          <p className="mt-2 text-sm text-gray-500">
            Registered {formattedCreatedAt}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-700">Status</h2>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isActive = detail.status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStatusChange(option.value)}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {detail.status === "read" && (
          <p className="mt-2 text-sm text-green-700">
            Marked as read — this item can no longer be deleted from the list.
          </p>
        )}
      </section>

      <section>
        <label
          htmlFor="reading-note"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Note
        </label>
        <textarea
          id="reading-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={6}
          placeholder="What did you learn?"
          className="w-full rounded border border-gray-300 p-3 text-sm focus:border-blue-400 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={!isNoteDirty}
            className="rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save note
          </button>
        </div>
      </section>
    </article>
  );
});

// Private Skeleton — page-level placeholder while the detail loads.
function ReadingItemDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="h-24 w-40 shrink-0 animate-pulse rounded bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
      <div className="h-8 w-72 animate-pulse rounded bg-gray-200" />
      <div className="h-32 w-full animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export function ReadingItemDetailComponent({
  detail,
  isPending,
  isRefetching,
  isNotFound,
  saveNote,
  changeStatus,
}: ReadingItemDetailFacade) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <BackLink />
      </div>

      {isPending ? (
        <ReadingItemDetailSkeleton />
      ) : isNotFound || !detail ? (
        <p className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-500">
          This reading item could not be found.
        </p>
      ) : (
        <div
          className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}
        >
          {/* key per item so the note draft re-seeds when navigating between
              items, even when the next item is already cached. */}
          <ReadingItemDetailBody
            key={detail.id}
            detail={detail}
            saveNote={saveNote}
            changeStatus={changeStatus}
          />
        </div>
      )}
    </div>
  );
}
