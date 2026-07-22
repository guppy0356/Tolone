import { memo, useEffect, useState } from "react";
import type { RequestDetailView } from "../TravelRequest.component.hook";

export interface RequestDetailDrawerProps {
  detailView: RequestDetailView | undefined;
  isDetailPending: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onApproveClick: () => void;
  onReject: () => void;
}

const statusBadgeClasses: Record<RequestDetailView["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

function DrawerBodySkeleton() {
  return (
    <div className="flex-1 space-y-3 p-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-5 animate-pulse rounded bg-gray-200" />
      ))}
    </div>
  );
}

export const RequestDetailDrawer = memo(function RequestDetailDrawer({
  detailView,
  isDetailPending,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
  onApproveClick,
  onReject,
}: RequestDetailDrawerProps) {
  // Purely-local slide-in mechanics: mount off-screen, then transition in.
  const [isEntered, setIsEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const isLoading = isDetailPending || detailView === undefined;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Travel expense detail"
        className={`fixed inset-y-0 left-0 z-40 flex w-[28rem] max-w-full flex-col bg-white shadow-xl transition-transform duration-300 ${
          isEntered ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 p-4">
          {isLoading ? (
            <div className="flex-1 space-y-2">
              <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold">{detailView.purpose}</h2>
              <p className="text-sm text-gray-500">{detailView.period}</p>
            </div>
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </header>

        {isLoading ? (
          <DrawerBodySkeleton />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[detailView.status]}`}
                >
                  {detailView.statusLabel}
                </span>
                <span className="text-sm text-gray-500">
                  {detailView.approvalCount} / 2 approvals
                </span>
              </div>

              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Expense breakdown
              </h3>
              <ul className="divide-y divide-gray-100">
                {detailView.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span>{item.label}</span>
                    <span className="tabular-nums">{item.amount}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-2 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{detailView.totalAmount}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              {detailView.canJudge ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onApproveClick}
                    className="flex-1 rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={onReject}
                    className="flex-1 rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  This request has been {detailView.statusLabel.toLowerCase()}.
                </p>
              )}
            </div>
          </>
        )}

        <footer className="flex items-center justify-between border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </footer>
      </aside>
    </>
  );
});
