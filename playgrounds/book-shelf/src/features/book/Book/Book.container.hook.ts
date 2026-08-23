import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookApi, type CreateBookInput } from "@api/Book.api";
import { bookQueries } from "@api/Book.queries";

export interface BookContainerState {
  registerBook: (input: CreateBookInput) => Promise<void>;
}

export function useBookContainer(): BookContainerState {
  const queryClient = useQueryClient();

  // No optimistic update: this page renders no books cache, so there is no
  // optimistic state for anyone to observe. Invalidating at the resource root
  // reconciles every books cache a later page adds under it.
  const registerMutation = useMutation({
    mutationFn: (input: CreateBookInput) => bookApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookQueries.all() });
    },
  });

  const registerBook = useCallback(
    async (input: CreateBookInput) => {
      await registerMutation.mutateAsync(input);
    },
    [registerMutation.mutateAsync],
  );

  return { registerBook };
}
