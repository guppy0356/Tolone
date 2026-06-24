import { useCallback, useMemo, useState } from "react";
import type {
  ReadingItemSummary,
  ReadingStatus,
  ReadingOrder,
  CreateReadingItemInput,
} from "./ReadingItem.api";
import type { ReadingItemListQuery } from "./ReadingItemList.facade";

const STATUS_LABELS: Record<ReadingStatus, string> = {
  unread: "Unread",
  reading: "Reading",
  read: "Read",
};

export const STATUS_FILTER_OPTIONS: { value: ReadingStatus; label: string }[] =
  (["unread", "reading", "read"] as const).map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }));

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

// View-model row: the raw summary plus display-ready fields derived here.
export interface ReadingItemRow {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  status: ReadingStatus;
  statusLabel: string;
  formattedCreatedAt: string;
  // "read" items cannot be deleted from the list.
  canDelete: boolean;
}

export interface ReadingItemListPresenterProps {
  items: ReadingItemSummary[];
  total: number;
  perPage: number;
  query: ReadingItemListQuery;
  setQuery: (query: ReadingItemListQuery) => void;
  addItem: (input: CreateReadingItemInput) => Promise<void>;
}

export interface ReadingItemListPresenter {
  rows: ReadingItemRow[];
  // Add form
  newUrl: string;
  setNewUrl: (value: string) => void;
  handleAddSubmit: () => Promise<void>;
  // Filters / sort (each resets to page 1)
  handleStatusFilterChange: (value: string) => void;
  handleCreatedFromChange: (value: string) => void;
  handleCreatedToChange: (value: string) => void;
  handleOrderChange: (value: string) => void;
  // Pagination
  totalPages: number;
  canPrevPage: boolean;
  canNextPage: boolean;
  handlePrevPage: () => void;
  handleNextPage: () => void;
}

export function useReadingItemListPresenter({
  items,
  total,
  perPage,
  query,
  setQuery,
  addItem,
}: ReadingItemListPresenterProps): ReadingItemListPresenter {
  const [newUrl, setNewUrl] = useState("");

  const rows = useMemo<ReadingItemRow[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        url: item.url,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        status: item.status,
        statusLabel: STATUS_LABELS[item.status],
        formattedCreatedAt: dateFormatter.format(new Date(item.createdAt)),
        canDelete: item.status !== "read",
      })),
    [items],
  );

  const handleAddSubmit = useCallback(async () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    await addItem({ url: trimmed });
    setNewUrl("");
  }, [newUrl, addItem]);

  // A new filter changes which items match, so the current page number may no
  // longer exist — reset to page 1 whenever a filter or the sort order changes.
  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setQuery({
        ...query,
        status: value === "all" ? undefined : (value as ReadingStatus),
        page: 1,
      });
    },
    [query, setQuery],
  );

  const handleCreatedFromChange = useCallback(
    (value: string) => {
      setQuery({ ...query, createdFrom: value || undefined, page: 1 });
    },
    [query, setQuery],
  );

  const handleCreatedToChange = useCallback(
    (value: string) => {
      setQuery({ ...query, createdTo: value || undefined, page: 1 });
    },
    [query, setQuery],
  );

  const handleOrderChange = useCallback(
    (value: string) => {
      setQuery({ ...query, order: value as ReadingOrder, page: 1 });
    },
    [query, setQuery],
  );

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const canPrevPage = query.page > 1;
  const canNextPage = query.page < totalPages;

  const handlePrevPage = useCallback(() => {
    if (query.page <= 1) return;
    setQuery({ ...query, page: query.page - 1 });
  }, [query, setQuery]);

  const handleNextPage = useCallback(() => {
    setQuery({ ...query, page: query.page + 1 });
  }, [query, setQuery]);

  return {
    rows,
    newUrl,
    setNewUrl,
    handleAddSubmit,
    handleStatusFilterChange,
    handleCreatedFromChange,
    handleCreatedToChange,
    handleOrderChange,
    totalPages,
    canPrevPage,
    canNextPage,
    handlePrevPage,
    handleNextPage,
  };
}
