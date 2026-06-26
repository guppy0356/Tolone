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
  CreateReadingItemInput,
} from "./ReadingItem.api";

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

// The presenter owns only genuinely local concerns now: the add-URL form state
// and the row view-model. Filter/sort/pagination are URL state, driven straight
// from the Component via <Link>/navigate — there is no setter to thread here.
export interface ReadingItemListPresenterProps {
  items: ReadingItemSummary[];
  addItem: (input: CreateReadingItemInput) => Promise<void>;
}

export interface ReadingItemListPresenter {
  rows: ReadingItemRow[];
  urlField: ReadingItemFormField;
  isAddValid: boolean;
  handleAddSubmit: () => Promise<void>;
}

export function useReadingItemListPresenter({
  items,
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

  return { rows, urlField, isAddValid: isValid, handleAddSubmit };
}
