import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { readingItemQueries } from "./ReadingItem.queries";
import {
  readingItemApi,
  type ReadingItem,
  type ReadingStatus,
} from "./ReadingItem.api";

export interface ReadingItemDetailFacadeProps {
  itemId: string;
}

export interface ReadingItemDetailFacade {
  detail: ReadingItem | undefined;
  isPending: boolean;
  isRefetching: boolean;
  isNotFound: boolean;
  saveNote: (note: string) => Promise<void>;
  changeStatus: (status: ReadingStatus) => Promise<void>;
}

export function useReadingItemDetailFacade({
  itemId,
}: ReadingItemDetailFacadeProps): ReadingItemDetailFacade {
  const queryClient = useQueryClient();
  const detailKey = readingItemQueries.detail(itemId).queryKey;

  const { data, isPending, isRefetching, error } = useQuery(
    readingItemQueries.detail(itemId),
  );

  const isNotFound =
    error instanceof HTTPError && error.response.status === 404;

  // Saving the note touches a field the list projection does not carry, so it
  // reconciles the detail only. Writing the authoritative response into the
  // detail cache skips a redundant refetch (the page stays on screen).
  const saveNoteMutation = useMutation({
    mutationFn: (note: string) => readingItemApi.update(itemId, { note }),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey, updated);
    },
  });

  // Status IS shown and filtered on the list, so a status change must also
  // invalidate every list variant — most importantly, marking "read" is what
  // disables that item's delete button back on the list.
  const changeStatusMutation = useMutation({
    mutationFn: (status: ReadingStatus) =>
      readingItemApi.update(itemId, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(detailKey, updated);
      queryClient.invalidateQueries({ queryKey: readingItemQueries.lists() });
    },
  });

  const saveNote = useCallback(
    async (note: string) => {
      await saveNoteMutation.mutateAsync(note);
    },
    [saveNoteMutation.mutateAsync],
  );

  const changeStatus = useCallback(
    async (status: ReadingStatus) => {
      await changeStatusMutation.mutateAsync(status);
    },
    [changeStatusMutation.mutateAsync],
  );

  return {
    detail: data,
    isPending,
    isRefetching,
    isNotFound,
    saveNote,
    changeStatus,
  };
}
