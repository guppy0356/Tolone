import { useCallback, useState } from "react";
import type { PatFacade } from "./Pat.facade";

export interface PatPresenterProps {
  addPat: PatFacade["addPat"];
  updatePat: PatFacade["updatePat"];
  deletePat: PatFacade["deletePat"];
}

export interface PatPresenter {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleCreate: () => Promise<void>;
  createError: string | null;
  dismissCreateError: () => void;

  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (value: string) => void;
  startEdit: (id: string, currentTitle: string) => void;
  cancelEdit: () => void;
  handleSaveEdit: () => Promise<void>;

  rowErrors: Record<string, string>;
  dismissRowError: (id: string) => void;
  handleDelete: (id: string) => Promise<void>;
}

export function usePatPresenter({
  addPat,
  updatePat,
  deletePat,
}: PatPresenterProps): PatPresenter {
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Error state lives in the Presenter (not the Facade) because per-row errors
  // need id-keyed state — useMutation only tracks the latest invocation, which
  // can't represent "row A and row B both failed and both messages still show."
  const [createError, setCreateError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const handleCreate = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setCreateError(null);
    try {
      await addPat({ title: trimmed });
      setNewTitle("");
    } catch {
      setCreateError("Failed to create token");
    }
  }, [newTitle, addPat]);

  const dismissCreateError = useCallback(() => {
    setCreateError(null);
  }, []);

  const startEdit = useCallback((id: string, currentTitle: string) => {
    setEditingId(id);
    setEditingTitle(currentTitle);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingTitle("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return;
    const id = editingId;
    const trimmed = editingTitle.trim();
    if (!trimmed) return;
    setRowErrors((prev) => {
      if (!(id in prev)) return prev;
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
    try {
      await updatePat(id, { title: trimmed });
      setEditingId(null);
      setEditingTitle("");
    } catch {
      setRowErrors((prev) => ({ ...prev, [id]: "Failed to update token" }));
    }
  }, [editingId, editingTitle, updatePat]);

  const handleDelete = useCallback(
    async (id: string) => {
      setRowErrors((prev) => {
        if (!(id in prev)) return prev;
        const { [id]: _drop, ...rest } = prev;
        return rest;
      });
      try {
        await deletePat(id);
      } catch {
        setRowErrors((prev) => ({ ...prev, [id]: "Failed to delete token" }));
      }
    },
    [deletePat],
  );

  const dismissRowError = useCallback((id: string) => {
    setRowErrors((prev) => {
      if (!(id in prev)) return prev;
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    newTitle,
    setNewTitle,
    handleCreate,
    createError,
    dismissCreateError,
    editingId,
    editingTitle,
    setEditingTitle,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    rowErrors,
    dismissRowError,
    handleDelete,
  };
}
