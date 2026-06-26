import { useCallback, useMemo } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createReadingItemSchema,
  type CreateReadingItemFormValues,
} from "./ReadingItem.schema";
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

// Plain field object so the Component never imports react-hook-form.
export interface ReadingItemFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
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
  // Add form (react-hook-form)
  urlField: ReadingItemFormField;
  isAddValid: boolean;
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
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { isValid },
  } = useForm<CreateReadingItemFormValues>({
    resolver: zodResolver(createReadingItemSchema),
    mode: "onChange",
    defaultValues: { url: "" },
  });

  const urlCtrl = useController({ name: "url", control });
  const urlField: ReadingItemFormField = {
    value: urlCtrl.field.value,
    onChange: (v) => urlCtrl.field.onChange(v),
    onBlur: urlCtrl.field.onBlur,
    error: urlCtrl.fieldState.error?.message,
  };

  const onAddSubmit = useCallback(
    async (data: CreateReadingItemFormValues) => {
      await addItem({ url: data.url });
      reset({ url: "" });
    },
    [addItem, reset],
  );

  const handleAddSubmit = useCallback(
    () => rhfHandleSubmit(onAddSubmit)(),
    [rhfHandleSubmit, onAddSubmit],
  );

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
    urlField,
    isAddValid: isValid,
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
