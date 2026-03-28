import { useState, useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  familyTodoApi,
  type FamilyTodo,
  type FamilyMember,
  type CreateFamilyTodoInput,
} from "./FamilyTodo.api";
import { getCurrentUserFromCookie, setCurrentUserCookie } from "../../lib/cookie";

export interface FamilyTodoFacade {
  todos: FamilyTodo[];
  isPending: boolean;
  isFetching: boolean;
  currentUser: FamilyMember;
  selectedMembers: FamilyMember[];
  selectMember: (member: FamilyMember) => void;
  addTodo: (input: CreateFamilyTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

const todoKeys = {
  all: ["family-todos"] as const,
  filtered: (owners: FamilyMember[]) =>
    [...todoKeys.all, { owners }] as const,
};

function getInitialUser(): FamilyMember {
  const fromCookie = getCurrentUserFromCookie();
  if (fromCookie) return fromCookie;
  setCurrentUserCookie("Papa");
  return "Papa";
}

export function useFamilyTodoFacade(): FamilyTodoFacade {
  const queryClient = useQueryClient();
  const [currentUser] = useState<FamilyMember>(getInitialUser);
  const [selectedMembers, setSelectedMembers] = useState<FamilyMember[]>([]);


  const queryKey = selectedMembers.length > 0
    ? todoKeys.filtered(selectedMembers)
    : todoKeys.all;

  const { data, isPending, isFetching } = useQuery({
    queryKey,
    queryFn: () => familyTodoApi.getAll(
      selectedMembers.length > 0 ? selectedMembers : undefined,
    ),
    placeholderData: keepPreviousData,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateFamilyTodoInput) => familyTodoApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FamilyTodo[]>(queryKey);
      queryClient.setQueryData<FamilyTodo[]>(queryKey, (old) => [
        ...(old ?? []),
        {
          id: crypto.randomUUID(),
          title: input.title,
          completed: false,
          owner: currentUser,
        },
      ]);
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      familyTodoApi.update(id, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FamilyTodo[]>(queryKey);
      queryClient.setQueryData<FamilyTodo[]>(queryKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, completed } : t)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => familyTodoApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FamilyTodo[]>(queryKey);
      queryClient.setQueryData<FamilyTodo[]>(queryKey, (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(queryKey, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
    },
  });

  const addTodo = useCallback(
    async (input: CreateFamilyTodoInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation.mutateAsync],
  );

  const toggleTodo = useCallback(
    async (id: string, completed: boolean) => {
      await toggleMutation.mutateAsync({ id, completed });
    },
    [toggleMutation.mutateAsync],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation.mutateAsync],
  );

  const selectMember = useCallback((member: FamilyMember) => {
    setSelectedMembers((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member],
    );
  }, []);

  return {
    todos: data ?? [],
    isPending,
    isFetching,
    currentUser,
    selectedMembers,
    selectMember,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
