import { useCallback } from "react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  familyTodoApi,
  type FamilyTodo,
  type FamilyMember,
  type CreateFamilyTodoInput,
} from "./FamilyTodo.api";

export interface FamilyTodoFacade {
  todos: FamilyTodo[];
  currentUser: FamilyMember;
  setCurrentUser: (member: FamilyMember) => void;
  addTodo: (input: CreateFamilyTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

const todoKeys = {
  all: ["family-todos"] as const,
};

export function useFamilyTodoFacade(
  currentUser: FamilyMember,
  setCurrentUser: (member: FamilyMember) => void,
): FamilyTodoFacade {
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery({
    queryKey: todoKeys.all,
    queryFn: familyTodoApi.getAll,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateFamilyTodoInput) => familyTodoApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<FamilyTodo[]>(todoKeys.all);
      queryClient.setQueryData<FamilyTodo[]>(todoKeys.all, (old) => [
        ...(old ?? []),
        {
          id: crypto.randomUUID(),
          title: input.title,
          completed: false,
          owner: input.owner,
        },
      ]);
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(todoKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      familyTodoApi.update(id, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<FamilyTodo[]>(todoKeys.all);
      queryClient.setQueryData<FamilyTodo[]>(todoKeys.all, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, completed } : t)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(todoKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => familyTodoApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<FamilyTodo[]>(todoKeys.all);
      queryClient.setQueryData<FamilyTodo[]>(todoKeys.all, (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(todoKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });

  const addTodo = useCallback(
    async (input: CreateFamilyTodoInput) => {
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
    currentUser,
    setCurrentUser,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
