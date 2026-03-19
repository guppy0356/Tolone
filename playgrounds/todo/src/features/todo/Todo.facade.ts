import { useCallback } from "react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { todoApi, type Todo, type CreateTodoInput } from "./Todo.api";

export interface TodoFacade {
  todos: Todo[];
  addTodo: (input: CreateTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

const todoKeys = {
  all: ["todos"] as const,
};

export function useTodoFacade(): TodoFacade {
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery({
    queryKey: todoKeys.all,
    queryFn: todoApi.getAll,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      todoApi.update(id, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => todoApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });

  const addTodo = useCallback(
    async (input: CreateTodoInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation],
  );

  const toggleTodo = useCallback(
    async (id: string, completed: boolean) => {
      await toggleMutation.mutateAsync({ id, completed });
    },
    [toggleMutation],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    todos: data,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
