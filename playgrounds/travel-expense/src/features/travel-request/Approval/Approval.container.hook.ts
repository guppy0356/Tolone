import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { travelRequestQueries } from "@api/TravelRequest.queries";
import {
  travelRequestApi,
  type TravelRequest,
  type TravelRequestDetail,
} from "@api/TravelRequest.api";
import { superiorQueries } from "@api/Superior.queries";
import type { Superior } from "@api/Superior.api";

export interface ApprovalContainerState {
  requests: TravelRequest[];
  isRequestsPending: boolean;
  isRequestsRefetching: boolean;
  selectedRequestId: string | null;
  selectRequest: (id: string | null) => void;
  detail: TravelRequestDetail | undefined;
  isDetailPending: boolean;
  superiors: Superior[];
  isSuperiorsPending: boolean;
  approve: (id: string, superiorId: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
}

export function useApprovalContainer(): ApprovalContainerState {
  const queryClient = useQueryClient();

  const {
    data: requests,
    isPending: isRequestsPending,
    isRefetching: isRequestsRefetching,
  } = useQuery(travelRequestQueries.list());

  // Hook-scoped query input: the selected row drives the detail query and is
  // deliberately kept out of the URL — the drawer is ephemeral, not a
  // shareable page.
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  const { data: detail, isPending: isDetailPending } = useQuery({
    ...travelRequestQueries.detail(selectedRequestId ?? ""),
    enabled: selectedRequestId !== null,
  });

  const { data: superiors, isPending: isSuperiorsPending } = useQuery(
    superiorQueries.list(),
  );

  // Approve/reject return the authoritative updated detail: write it into the
  // detail cache (no refetch needed) and invalidate the list, which renders
  // the changed status/approvalCount. The drawer stays open over the list, so
  // both caches are observed — but the next state (completion at two
  // approvals) is server logic, so no optimistic write.
  const approveMutation = useMutation({
    mutationFn: ({ id, superiorId }: { id: string; superiorId: string }) =>
      travelRequestApi.approve(id, { superiorId }),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        travelRequestQueries.detail(updated.id).queryKey,
        updated,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: travelRequestQueries.list().queryKey,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => travelRequestApi.reject(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        travelRequestQueries.detail(updated.id).queryKey,
        updated,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: travelRequestQueries.list().queryKey,
      });
    },
  });

  const approve = useCallback(
    async (id: string, superiorId: string) => {
      await approveMutation.mutateAsync({ id, superiorId });
    },
    [approveMutation.mutateAsync],
  );

  const reject = useCallback(
    async (id: string) => {
      await rejectMutation.mutateAsync(id);
    },
    [rejectMutation.mutateAsync],
  );

  return {
    requests: requests ?? [],
    isRequestsPending,
    isRequestsRefetching,
    selectedRequestId,
    selectRequest: setSelectedRequestId,
    detail,
    isDetailPending,
    superiors: superiors ?? [],
    isSuperiorsPending,
    approve,
    reject,
  };
}
