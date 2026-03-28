import { useState, useCallback } from "react";
import type { FamilyMember } from "./FamilyTodo.api";
import type { CreateFamilyTodoInput } from "./FamilyTodo.api";

export interface FamilyTodoFormProps {
  addTodo: (input: CreateFamilyTodoInput) => Promise<void>;
  currentUser: FamilyMember;
}

export interface FamilyTodoFormPresenter {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useFamilyTodoFormPresenter({
  addTodo,
  currentUser,
}: FamilyTodoFormProps): FamilyTodoFormPresenter {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed, owner: currentUser });
    setNewTitle("");
  }, [newTitle, addTodo, currentUser]);

  return {
    newTitle,
    setNewTitle,
    handleSubmit,
  };
}
