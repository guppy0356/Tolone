import { useState, useCallback } from "react";
import type { useTodoFacade } from "./Todo.facade";

type Props = Pick<ReturnType<typeof useTodoFacade>, "addTodo">;

export function useTodoPresenter({ addTodo }: Props) {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return { newTitle, setNewTitle, handleSubmit } as const;
}
