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

export interface FamilyTodoFacade {
  todos: FamilyTodo[];
  isPending: boolean;
  isFetching: boolean;
  currentUser: FamilyMember;
  setCurrentUser: (member: FamilyMember) => void;
  selectedMembers: FamilyMember[];
  toggleMemberSelection: (member: FamilyMember) => void;
  removeMember: (member: FamilyMember) => void;
  addTodo: (input: CreateFamilyTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

const todoKeys = {
  all: ["family-todos"] as const,
  filtered: (owners: FamilyMember[]) =>
    [...todoKeys.all, { owners }] as const,
};

export function useFamilyTodoFacade(
  currentUser: FamilyMember,
  setCurrentUser: (member: FamilyMember) => void,
): FamilyTodoFacade {
  const queryClient = useQueryClient();
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
          owner: input.owner,
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

  const toggleMemberSelection = useCallback((member: FamilyMember) => {
    setSelectedMembers((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member],
    );
  }, []);

  const removeMember = useCallback((member: FamilyMember) => {
    setSelectedMembers((prev) => prev.filter((m) => m !== member));
  }, []);

  return {
    todos: data ?? [],
    isPending,
    isFetching,
    currentUser,
    setCurrentUser,
    selectedMembers,
    toggleMemberSelection,
    removeMember,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
