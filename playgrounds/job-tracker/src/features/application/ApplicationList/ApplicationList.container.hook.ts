import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationQueries } from "@api/Application.queries";
import {
  applicationApi,
  type ApplicationListParams,
  type ApplicationPage,
  type ApplicationStatus,
  type ApplicationSummary,
} from "@api/Application.api";

export interface ApplicationListContainerParams {
  params: ApplicationListParams;
}

export interface ApplicationListContainerState {
  applications: ApplicationSummary[];
  total: number;
  pageSize: number;
  isPending: boolean;
  isRefetching: boolean;
  updateStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

export function useApplicationListContainer({
  params,
}: ApplicationListContainerParams): ApplicationListContainerState {
  const queryClient = useQueryClient();

  const listQuery = applicationQueries.list(params);
  const { data, isPending, isRefetching } = useQuery(listQuery);

  // Optimistic: the list stays on screen while a row's status changes, so the
  // user observes the mutated cache. The current variant is patched in place,
  // then every variant is invalidated — a row may belong to another filter now.
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData<ApplicationPage>(listQuery.queryKey);
      queryClient.setQueryData<ApplicationPage>(listQuery.queryKey, (old) =>
        old && {
          ...old,
          items: old.items.map((item) => (item.id === id ? { ...item, status } : item)),
        },
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    onSuccess: (detail) => {
      // The response is the authoritative detail: write it instead of refetching.
      queryClient.setQueryData(applicationQueries.detail(detail.id).queryKey, detail);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: applicationQueries.lists() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData<ApplicationPage>(listQuery.queryKey);
      queryClient.setQueryData<ApplicationPage>(listQuery.queryKey, (old) =>
        old && {
          ...old,
          total: old.total - 1,
          items: old.items.filter((item) => item.id !== id),
        },
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    onSettled: (_data, _error, id) => {
      // Invalidating the detail would refetch a deleted application → 404.
      queryClient.removeQueries({ queryKey: applicationQueries.detail(id).queryKey });
      queryClient.invalidateQueries({ queryKey: applicationQueries.lists() });
    },
  });

  const updateStatus = useCallback(
    async (id: string, status: ApplicationStatus) => {
      await updateMutation.mutateAsync({ id, status });
    },
    [updateMutation.mutateAsync],
  );

  const deleteApplication = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation.mutateAsync],
  );

  return {
    applications: data?.items ?? [],
    total: data?.total ?? 0,
    pageSize: data?.pageSize ?? 1,
    isPending,
    isRefetching,
    updateStatus,
    deleteApplication,
  };
}
