import { useState, useEffect, useCallback } from "react";
import { todoApi, type Todo, type CreateTodoInput } from "./Todo.api";

export function useTodoFacade() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoApi.getAll();
      setTodos(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch todos"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = useCallback(async (input: CreateTodoInput) => {
    const todo = await todoApi.create(input);
    setTodos((prev) => [...prev, todo]);
  }, []);

  const toggleTodo = useCallback(async (id: string, completed: boolean) => {
    const updated = await todoApi.update(id, { completed });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    await todoApi.delete(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { todos, loading, error, addTodo, toggleTodo, deleteTodo } as const;
}
