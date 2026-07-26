import { memo } from "react";
import {
  useTravelRequestComponent,
  type RequestRowView,
} from "./TravelRequest.component.hook";
import type { TravelRequestContainerState } from "./TravelRequest.container.hook";
import type { TravelRequestStatus } from "@api/TravelRequest.api";
import { RequestDetailDrawer } from "./components/RequestDetailDrawer.component";
import { SuperiorSelectDrawer } from "./components/SuperiorSelectDrawer.component";

const statusBadgeClasses: Record<TravelRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

// Private memo'd body
const RequestList = memo(function RequestList({
  rows,
  selectedRequestId,
  onSelect,
}: {
  rows: RequestRowView[];
  selectedRequestId: string | null;
  onSelect: (id: string) => void;
}) {
  if (rows.length === 0) {
    return <p className="text-gray-500">No travel expense requests.</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            onClick={() => onSelect(row.id)}
            aria-current={row.id === selectedRequestId ? "true" : undefined}
            className={`flex w-full items-center justify-between gap-4 rounded border p-3 text-left hover:bg-gray-50 ${
              row.id === selectedRequestId
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{row.purpose}</span>
              <span className="block text-sm text-gray-500">{row.period}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-semibold tabular-nums">
                {row.totalAmount}
              </span>
              <span className="flex items-center gap-2">
                {row.status === "pending" && (
                  <span className="text-xs text-gray-500">
                    {row.approvalCount}/2 approved
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[row.status]}`}
                >
                  {row.statusLabel}
                </span>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
});

// Private Skeleton (li-granular)
function RequestListSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="flex items-center justify-between rounded border border-gray-200 p-3"
        >
          <div className="space-y-2">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export function TravelRequestComponent({
  requests,
  isRequestsPending,
  isRequestsRefetching,
  selectedRequestId,
  selectRequest,
  detail,
  isDetailPending,
  superiors,
  isSuperiorsPending,
  approve,
  reject,
}: TravelRequestContainerState) {
  const {
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
  } = useTravelRequestComponent({
    requests,
    detail,
    selectedRequestId,
    selectRequest,
    approve,
    reject,
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* While the superior drawer is open, inert removes everything behind
          it — heading, list, detail drawer — from hit testing, the tab order,
          and the accessibility tree, so an outside click can only dismiss the
          superior drawer, never activate what it lands on. */}
      <div inert={isSuperiorDrawerOpen}>
        <h1 className="mb-4 text-2xl font-bold">Travel Expense Approvals</h1>

        {isRequestsPending ? (
          <RequestListSkeleton />
        ) : (
          <div
            ref={listRef}
            className={`transition-opacity ${isRequestsRefetching ? "opacity-50" : ""}`}
          >
            <RequestList
              rows={rows}
              selectedRequestId={selectedRequestId}
              onSelect={selectRow}
            />
          </div>
        )}

        <RequestDetailDrawer
          ref={detailDrawerRef}
          isOpen={isDetailDrawerOpen}
          detailView={detailView}
          isDetailPending={isDetailPending}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={goPrev}
          onNext={goNext}
          onClose={closeDetail}
          onApproveClick={openSuperiorDrawer}
          onReject={handleReject}
        />
      </div>

      <SuperiorSelectDrawer
        ref={superiorDrawerRef}
        isOpen={isSuperiorDrawerOpen}
        superiors={superiors}
        isSuperiorsPending={isSuperiorsPending}
        onSelect={handleApprove}
        onClose={closeSuperiorDrawer}
      />
    </div>
  );
}
