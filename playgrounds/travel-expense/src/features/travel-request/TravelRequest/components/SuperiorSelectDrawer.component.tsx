import { memo, useEffect, useState } from "react";
import type { Superior } from "@api/Superior.api";

export interface SuperiorSelectDrawerProps {
  superiors: Superior[];
  isSuperiorsPending: boolean;
  onSelect: (superiorId: string) => void;
  onClose: () => void;
}

function SuperiorListSkeleton() {
  return (
    <ul className="divide-y divide-gray-100">
      {[0, 1, 2].map((i) => (
        <li key={i} className="space-y-1 px-4 py-3">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

export const SuperiorSelectDrawer = memo(function SuperiorSelectDrawer({
  superiors,
  isSuperiorsPending,
  onSelect,
  onClose,
}: SuperiorSelectDrawerProps) {
  // Purely-local slide-in mechanics: mount off-screen, then transition in.
  const [isEntered, setIsEntered] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-[45] bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* w-56: half the detail drawer's w-[28rem] */}
      <aside
        role="dialog"
        aria-label="Select next approver"
        className={`fixed inset-y-0 left-0 z-50 flex w-56 max-w-full flex-col bg-white shadow-xl transition-transform duration-300 ${
          isEntered ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between gap-2 border-b border-gray-200 p-4">
          <h2 className="text-sm font-semibold">Select next approver</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {isSuperiorsPending ? (
            <SuperiorListSkeleton />
          ) : (
            <ul className="divide-y divide-gray-100">
              {superiors.map((superior) => (
                <li key={superior.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(superior.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="block font-medium">{superior.name}</span>
                    <span className="block text-sm text-gray-500">
                      {superior.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
});
