import { useCallback, useEffect } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { noteSchema, type NoteFormValues } from "./ReadingItem.schema";
import type { ReadingItem, ReadingStatus } from "./ReadingItem.api";

const STATUS_LABELS: Record<ReadingStatus, string> = {
  unread: "Unread",
  reading: "Reading",
  read: "Read",
};

export const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = (
  ["unread", "reading", "read"] as const
).map((value) => ({ value, label: STATUS_LABELS[value] }));

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// Plain field object so the Component never imports react-hook-form.
export interface NoteFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

export interface ReadingItemDetailPresenterProps {
  detail: ReadingItem;
  saveNote: (note: string) => Promise<void>;
  changeStatus: (status: ReadingStatus) => Promise<void>;
}

export interface ReadingItemDetailPresenter {
  noteField: NoteFormField;
  isNoteDirty: boolean;
  isNoteValid: boolean;
  isSavingNote: boolean;
  handleSaveNote: () => Promise<void>;
  handleStatusChange: (status: ReadingStatus) => Promise<void>;
  statusLabel: string;
  formattedCreatedAt: string;
}

export function useReadingItemDetailPresenter({
  detail,
  saveNote,
  changeStatus,
}: ReadingItemDetailPresenterProps): ReadingItemDetailPresenter {
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    mode: "onChange",
    defaultValues: { note: detail.note },
  });

  // Re-seed only when the *saved note* changes (after a successful save, or a
  // detail refetch). Keying on detail.note — not the whole detail object —
  // means a status-only update won't reset an unsaved note draft. The body is
  // also keyed by detail.id, so switching items remounts and re-seeds.
  useEffect(() => {
    reset({ note: detail.note });
  }, [detail.note, reset]);

  const noteCtrl = useController({ name: "note", control });
  const noteField: NoteFormField = {
    value: noteCtrl.field.value,
    onChange: (v) => noteCtrl.field.onChange(v),
    onBlur: noteCtrl.field.onBlur,
    error: noteCtrl.fieldState.error?.message,
  };

  const onSaveNote = useCallback(
    async (data: NoteFormValues) => {
      await saveNote(data.note);
      reset({ note: data.note });
    },
    [saveNote, reset],
  );

  const handleSaveNote = useCallback(
    () => rhfHandleSubmit(onSaveNote)(),
    [rhfHandleSubmit, onSaveNote],
  );

  const handleStatusChange = useCallback(
    async (status: ReadingStatus) => {
      if (status === detail.status) return;
      await changeStatus(status);
    },
    [detail.status, changeStatus],
  );

  return {
    noteField,
    isNoteDirty: isDirty,
    isNoteValid: isValid,
    isSavingNote: isSubmitting,
    handleSaveNote,
    handleStatusChange,
    statusLabel: STATUS_LABELS[detail.status],
    formattedCreatedAt: dateFormatter.format(new Date(detail.createdAt)),
  };
}
