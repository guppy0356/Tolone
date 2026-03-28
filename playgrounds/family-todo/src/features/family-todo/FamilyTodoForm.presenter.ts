import { useState, useCallback } from "react";
import type { CreateFamilyTodoInput } from "./FamilyTodo.api";

export interface FamilyTodoFormProps {
  addTodo: (input: CreateFamilyTodoInput) => Promise<void>;
}

export interface FamilyTodoFormPresenter {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useFamilyTodoFormPresenter({
  addTodo,
}: FamilyTodoFormProps): FamilyTodoFormPresenter {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return {
    newTitle,
    setNewTitle,
    handleSubmit,
  };
}
