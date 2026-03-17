import { useState, useCallback } from "react";
import type { TodoFacade } from "./Todo.facade";

export interface TodoPresenter {
  todos: TodoFacade["todos"];
  loading: boolean;
  error: Error | null;
  toggleTodo: TodoFacade["toggleTodo"];
  deleteTodo: TodoFacade["deleteTodo"];
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useTodoPresenter({
  todos,
  loading,
  error,
  addTodo,
  toggleTodo,
  deleteTodo,
}: TodoFacade): TodoPresenter {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return {
    todos,
    loading,
    error,
    toggleTodo,
    deleteTodo,
    newTitle,
    setNewTitle,
    handleSubmit,
  };
}
