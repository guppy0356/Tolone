import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type {
  TravelRequest,
  TravelRequestDetail,
  TravelRequestStatus,
} from "@api/TravelRequest.api";
import type { TravelRequestContainerState } from "./TravelRequest.container.hook";

export interface RequestRowView {
  id: string;
  purpose: string;
  period: string;
  totalAmount: string;
  statusLabel: string;
  status: TravelRequestStatus;
  approvalCount: number;
}

export interface ExpenseItemView {
  id: string;
  label: string;
  amount: string;
}

export interface RequestDetailView {
  id: string;
  purpose: string;
  period: string;
  totalAmount: string;
  statusLabel: string;
  status: TravelRequestStatus;
  approvalCount: number;
  canJudge: boolean;
  items: ExpenseItemView[];
}

export interface TravelRequestComponentParams {
  requests: TravelRequest[];
  detail: TravelRequestDetail | undefined;
  selectedRequestId: string | null;
  selectRequest: TravelRequestContainerState["selectRequest"];
  approve: TravelRequestContainerState["approve"];
  reject: TravelRequestContainerState["reject"];
}

export interface TravelRequestComponentState {
  rows: RequestRowView[];
  detailView: RequestDetailView | undefined;
  isDetailDrawerOpen: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  detailDrawerRef: RefObject<HTMLElement | null>;
  superiorDrawerRef: RefObject<HTMLElement | null>;
  selectRow: (id: string) => void;
  goPrev: () => void;
  goNext: () => void;
  closeDetail: () => void;
  isSuperiorDrawerOpen: boolean;
  openSuperiorDrawer: () => void;
  closeSuperiorDrawer: () => void;
  handleApprove: (superiorId: string) => Promise<void>;
  handleReject: () => Promise<void>;
}

const statusLabels: Record<TravelRequestStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  rejected: "Rejected",
};

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

function formatPeriod(startDate: string, endDate: string): string {
  return `${startDate} – ${endDate}`;
}

export function useTravelRequestComponent({
  requests,
  detail,
  selectedRequestId,
  selectRequest,
  approve,
  reject,
}: TravelRequestComponentParams): TravelRequestComponentState {
  const [isSuperiorDrawerOpen, setIsSuperiorDrawerOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const detailDrawerRef = useRef<HTMLElement>(null);
  const superiorDrawerRef = useRef<HTMLElement>(null);

  const isDetailDrawerOpen = selectedRequestId !== null;

  const rows = useMemo(
    () =>
      requests.map((request) => ({
        id: request.id,
        purpose: request.purpose,
        period: formatPeriod(request.startDate, request.endDate),
        totalAmount: formatAmount(request.totalAmount),
        statusLabel: statusLabels[request.status],
        status: request.status,
        approvalCount: request.approvalCount,
      })),
    [requests],
  );

  const detailView = useMemo(
    () =>
      detail && {
        id: detail.id,
        purpose: detail.purpose,
        period: formatPeriod(detail.startDate, detail.endDate),
        totalAmount: formatAmount(detail.totalAmount),
        statusLabel: statusLabels[detail.status],
        status: detail.status,
        approvalCount: detail.approvalCount,
        canJudge: detail.status === "pending",
        items: detail.items.map((item) => ({
          id: item.id,
          label: item.label,
          amount: formatAmount(item.amount),
        })),
      },
    [detail],
  );

  const selectedIndex = useMemo(
    () => requests.findIndex((request) => request.id === selectedRequestId),
    [requests, selectedRequestId],
  );
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex !== -1 && selectedIndex < requests.length - 1;

  // Moving to another request abandons any approval-in-selection, so the
  // stacked superior drawer closes alongside every selection change.
  const selectRow = useCallback(
    (id: string) => {
      setIsSuperiorDrawerOpen(false);
      selectRequest(id);
    },
    [selectRequest],
  );

  const goPrev = useCallback(() => {
    if (selectedIndex > 0) {
      setIsSuperiorDrawerOpen(false);
      selectRequest(requests[selectedIndex - 1].id);
    }
  }, [requests, selectedIndex, selectRequest]);

  const goNext = useCallback(() => {
    if (selectedIndex !== -1 && selectedIndex < requests.length - 1) {
      setIsSuperiorDrawerOpen(false);
      selectRequest(requests[selectedIndex + 1].id);
    }
  }, [requests, selectedIndex, selectRequest]);

  const closeDetail = useCallback(() => {
    setIsSuperiorDrawerOpen(false);
    selectRequest(null);
  }, [selectRequest]);

  // Clicking outside closes the drawer — except inside the list, whose rows
  // switch the selection instead of dismissing. While the superior drawer is
  // open, its own outside-click listener owns dismissal, so this one stands
  // down: the first outside click closes only the superior drawer, the next
  // one closes this drawer.
  useEffect(() => {
    if (selectedRequestId === null || isSuperiorDrawerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (listRef.current?.contains(target)) return;
      if (detailDrawerRef.current?.contains(target)) return;
      closeDetail();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedRequestId, isSuperiorDrawerOpen, closeDetail]);

  const openSuperiorDrawer = useCallback(() => {
    setIsSuperiorDrawerOpen(true);
  }, []);

  const closeSuperiorDrawer = useCallback(() => {
    setIsSuperiorDrawerOpen(false);
  }, []);

  // Everything behind the open superior drawer is inert, so clicks landing
  // there target a non-inert ancestor and never activate what's underneath —
  // the outside click only dismisses this drawer.
  useEffect(() => {
    if (!isSuperiorDrawerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (superiorDrawerRef.current?.contains(target)) return;
      closeSuperiorDrawer();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isSuperiorDrawerOpen, closeSuperiorDrawer]);

  const handleApprove = useCallback(
    async (superiorId: string) => {
      if (selectedRequestId === null) return;
      await approve(selectedRequestId, superiorId);
      setIsSuperiorDrawerOpen(false);
    },
    [selectedRequestId, approve],
  );

  const handleReject = useCallback(async () => {
    if (selectedRequestId === null) return;
    await reject(selectedRequestId);
  }, [selectedRequestId, reject]);

  return {
    rows,
    detailView,
    isDetailDrawerOpen,
    hasPrev,
    hasNext,
    listRef,
    detailDrawerRef,
    superiorDrawerRef,
    selectRow,
    goPrev,
    goNext,
    closeDetail,
    isSuperiorDrawerOpen,
    openSuperiorDrawer,
    closeSuperiorDrawer,
    handleApprove,
    handleReject,
  };
}
