import { memo, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type {
  ReadingItemListFacade,
  ReadingItemListQuery,
} from "./ReadingItemList.facade";
import type { ReadingStatus, ReadingOrder } from "./ReadingItem.api";
import {
  useReadingItemListPresenter,
  STATUS_FILTER_OPTIONS,
  type ReadingItemRow,
} from "./ReadingItemList.presenter";

// The facade returns only server state; `query` (the URL search) is supplied by
// the container. There is no setter prop — the Component writes the URL itself
// via <Link>/navigate with functional updaters.
type ReadingItemListComponentProps = ReadingItemListFacade & {
  query: ReadingItemListQuery;
};

const STATUS_BADGE_CLASS: Record<ReadingStatus, string> = {
  unread: "bg-gray-100 text-gray-700",
  reading: "bg-amber-100 text-amber-800",
  read: "bg-green-100 text-green-800",
};

function StatusBadge({
  status,
  label,
}: {
  status: ReadingStatus;
  label: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[status]}`}
    >
      {label}
    </span>
  );
}

// Private memo'd body — a pure view over the finished row view-model plus the
// stable delete action. Reference-stable props keep the memo effective across
// the parent's isRefetching toggles.
const ReadingItemRows = memo(function ReadingItemRows({
  rows,
  onDelete,
}: {
  rows: ReadingItemRow[];
  onDelete: ReadingItemListFacade["deleteItem"];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-500">
        No reading items match. Save a URL above to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-stretch gap-3 rounded border border-gray-200 bg-white"
        >
          <Link
            to="/reading-list/$itemId"
            params={{ itemId: row.id }}
            className="flex flex-1 items-center gap-3 p-3 transition-colors hover:bg-blue-50/40"
          >
            <img
              src={row.thumbnailUrl}
              alt=""
              className="h-14 w-24 shrink-0 rounded bg-gray-100 object-cover"
            />
            <div className="min-w-0">
              <div className="truncate font-medium text-gray-900">
                {row.title}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <StatusBadge status={row.status} label={row.statusLabel} />
                <span>{row.formattedCreatedAt}</span>
              </div>
            </div>
          </Link>
          <div className="flex items-center p-3">
            <button
              type="button"
              onClick={() => onDelete(row.id)}
              disabled={!row.canDelete}
              title={row.canDelete ? "Delete" : "Read items can't be deleted"}
              className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
});

// Private Skeleton — li-granular placeholder matching the row shape.
function ReadingItemListSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded border border-gray-200 bg-white p-3"
        >
          <div className="h-14 w-24 shrink-0 animate-pulse rounded bg-gray-200" />
          <div className="flex-1">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}

const controlClass =
  "rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none";
const pageLinkClass =
  "rounded border border-gray-300 px-3 py-1 font-medium hover:bg-gray-50";
const pageDisabledClass =
  "rounded border border-gray-200 px-3 py-1 font-medium text-gray-300";

export function ReadingItemListComponent({
  items,
  total,
  perPage,
  query,
  isPending,
  isRefetching,
  addItem,
  deleteItem,
}: ReadingItemListComponentProps) {
  const { rows, urlField, isAddValid, handleAddSubmit } =
    useReadingItemListPresenter({ items, addItem });

  const navigate = useNavigate();

  // A filter or sort change reorders/refilters the list, so jump back to page 1
  // while preserving the other params. We patch the current (typed) search and
  // navigate — there is no setQuery indirection. (Built from `query` rather than
  // a `(prev) =>` updater because zod defaults make the updater's `prev` the
  // optional input type, which can't satisfy the required output return.)
  const applyFilter = useCallback(
    (patch: Partial<ReadingItemListQuery>) =>
      navigate({ to: "/reading-list", search: { ...query, ...patch, page: 1 } }),
    [navigate, query],
  );

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Reading List</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddSubmit();
        }}
        className="mb-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={urlField.value}
            onChange={(e) => urlField.onChange(e.target.value)}
            onBlur={urlField.onBlur}
            placeholder="Paste a URL to save"
            aria-invalid={urlField.error ? true : undefined}
            className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!isAddValid}
            className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        </div>
        {urlField.error && (
          <p className="mt-1 text-sm text-red-500">{urlField.error}</p>
        )}
      </form>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Status
          <select
            value={query.status ?? "all"}
            onChange={(e) =>
              applyFilter({
                status:
                  e.target.value === "all"
                    ? undefined
                    : (e.target.value as ReadingStatus),
              })
            }
            className={controlClass}
          >
            <option value="all">All</option>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Registered from
          <input
            type="date"
            value={query.createdFrom ?? ""}
            onChange={(e) =>
              applyFilter({ createdFrom: e.target.value || undefined })
            }
            className={controlClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Registered to
          <input
            type="date"
            value={query.createdTo ?? ""}
            onChange={(e) =>
              applyFilter({ createdTo: e.target.value || undefined })
            }
            className={controlClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Sort
          <select
            value={query.order}
            onChange={(e) =>
              applyFilter({ order: e.target.value as ReadingOrder })
            }
            className={controlClass}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
      </div>

      {isPending ? (
        <ReadingItemListSkeleton />
      ) : (
        <>
          <div
            className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}
          >
            <ReadingItemRows rows={rows} onDelete={deleteItem} />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            {query.page > 1 ? (
              <Link
                to="/reading-list"
                search={{ ...query, page: query.page - 1 }}
                className={pageLinkClass}
              >
                Previous
              </Link>
            ) : (
              <span className={pageDisabledClass}>Previous</span>
            )}
            <span className="text-gray-500">
              Page {query.page} of {totalPages} · {total} item
              {total === 1 ? "" : "s"}
            </span>
            {query.page < totalPages ? (
              <Link
                to="/reading-list"
                search={{ ...query, page: query.page + 1 }}
                className={pageLinkClass}
              >
                Next
              </Link>
            ) : (
              <span className={pageDisabledClass}>Next</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
