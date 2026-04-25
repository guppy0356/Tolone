import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  patApi,
  type Pat,
  type CreatePatInput,
  type UpdatePatInput,
} from "./Pat.api";

export interface PatFacade {
  pats: Pat[];
  isPending: boolean;
  isFetching: boolean;
  addPat: (input: CreatePatInput) => Promise<void>;
  updatePat: (id: string, input: UpdatePatInput) => Promise<void>;
  deletePat: (id: string) => Promise<void>;
}

const patKeys = {
  all: ["pats"] as const,
};

export function usePatFacade(): PatFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching } = useQuery({
    queryKey: patKeys.all,
    queryFn: patApi.getAll,
    placeholderData: keepPreviousData,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreatePatInput) => patApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: patKeys.all });
      const previous = queryClient.getQueryData<Pat[]>(patKeys.all);
      queryClient.setQueryData<Pat[]>(patKeys.all, (old) => [
        ...(old ?? []),
        {
          id: crypto.randomUUID(),
          title: input.title,
          createdAt: new Date().toISOString(),
        },
      ]);
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(patKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: patKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePatInput }) =>
      patApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: patKeys.all });
      const previous = queryClient.getQueryData<Pat[]>(patKeys.all);
      queryClient.setQueryData<Pat[]>(patKeys.all, (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, ...input } : p)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(patKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: patKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: patKeys.all });
      const previous = queryClient.getQueryData<Pat[]>(patKeys.all);
      queryClient.setQueryData<Pat[]>(patKeys.all, (old) =>
        (old ?? []).filter((p) => p.id !== id),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(patKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: patKeys.all });
    },
  });

  const addPat = useCallback(
    async (input: CreatePatInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation],
  );

  const updatePat = useCallback(
    async (id: string, input: UpdatePatInput) => {
      await updateMutation.mutateAsync({ id, input });
    },
    [updateMutation],
  );

  const deletePat = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    pats: data ?? [],
    isPending,
    isFetching,
    addPat,
    updatePat,
    deletePat,
  };
}
