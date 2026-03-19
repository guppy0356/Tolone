import { useState, useCallback } from "react";
import type { TodoFacade } from "./Todo.facade";

export interface TodoPresenter {
  todos: TodoFacade["todos"];
  toggleTodo: TodoFacade["toggleTodo"];
  deleteTodo: TodoFacade["deleteTodo"];
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useTodoPresenter({
  todos,
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
    toggleTodo,
    deleteTodo,
    newTitle,
    setNewTitle,
    handleSubmit,
  };
}
