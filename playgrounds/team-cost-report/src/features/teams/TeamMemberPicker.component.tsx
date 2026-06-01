import { memo } from "react";
import type { Member } from "./Members.api";

export interface TeamMemberPickerProps {
  open: boolean;
  query: string;
  setQuery: (q: string) => void;
  candidates: Member[];
  isSearching: boolean;
  onAdd: (member: Member) => void;
  onClose: () => void;
}

export const TeamMemberPicker = memo(function TeamMemberPicker({
  open,
  query,
  setQuery,
  candidates,
  isSearching,
  onAdd,
  onClose,
}: TeamMemberPickerProps) {
  if (!open) return null;

  const selectMember = (member: Member) => {
    onAdd(member);
    onClose();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          role="combobox"
          aria-expanded={true}
          aria-label="Search members"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          placeholder="Search members..."
          className="flex-1 rounded border border-blue-400 px-3 py-2 text-sm ring-2 ring-blue-400/40 focus:outline-none"
        />
        <button
          type="button"
          aria-label="Close member picker"
          onClick={onClose}
          className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
        {isSearching && candidates.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
        ) : candidates.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500">
            No members match
          </div>
        ) : (
          candidates.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => selectMember(m)}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-blue-50"
            >
              {m.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
});
