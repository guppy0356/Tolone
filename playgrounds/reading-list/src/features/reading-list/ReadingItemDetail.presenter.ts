import { useCallback, useState } from "react";
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

export interface ReadingItemDetailPresenterProps {
  detail: ReadingItem;
  saveNote: (note: string) => Promise<void>;
  changeStatus: (status: ReadingStatus) => Promise<void>;
}

export interface ReadingItemDetailPresenter {
  note: string;
  setNote: (value: string) => void;
  isNoteDirty: boolean;
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
  // Seeded from the saved note. The Component remounts this body per item id
  // (key={detail.id}), so the draft re-seeds when navigating between items;
  // within one item, saving rewrites the cache to the typed value, keeping the
  // draft and the saved note in sync.
  const [note, setNote] = useState(detail.note);

  const isNoteDirty = note !== detail.note;

  const handleSaveNote = useCallback(async () => {
    if (note === detail.note) return;
    await saveNote(note);
  }, [note, detail.note, saveNote]);

  const handleStatusChange = useCallback(
    async (status: ReadingStatus) => {
      if (status === detail.status) return;
      await changeStatus(status);
    },
    [detail.status, changeStatus],
  );

  return {
    note,
    setNote,
    isNoteDirty,
    handleSaveNote,
    handleStatusChange,
    statusLabel: STATUS_LABELS[detail.status],
    formattedCreatedAt: dateFormatter.format(new Date(detail.createdAt)),
  };
}
