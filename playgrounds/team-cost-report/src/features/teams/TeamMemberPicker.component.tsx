import { memo } from "react";
import {
  useTeamMemberPickerPresenter,
  type TeamMemberPickerPresenterProps,
} from "./TeamMemberPicker.presenter";

export const TeamMemberPicker = memo(function TeamMemberPicker(
  props: TeamMemberPickerPresenterProps,
) {
  const { picked } = props;
  const {
    open,
    startAdding,
    cancelAdding,
    query,
    setQuery,
    candidates,
    isSearching,
    selectMember,
    removePicked,
    setRate,
    containerRef,
    inputRef,
  } = useTeamMemberPickerPresenter(props);

  return (
    <div ref={containerRef} className="space-y-3">
      {picked.length > 0 && (
        <ul className="space-y-2">
          {picked.map((p) => (
            <li
              key={p.memberId}
              className="flex items-center gap-3 rounded border border-gray-200 bg-white p-2.5"
            >
              <span className="flex-1 text-sm text-gray-800">{p.name}</span>
              <label className="flex items-center gap-1 text-sm text-gray-600">
                <span>$</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={p.hourlyRate || ""}
                  onChange={(e) => setRate(p.memberId, e.target.value)}
                  placeholder="rate"
                  aria-label={`Hourly rate for ${p.name}`}
                  className="w-24 rounded border border-gray-300 px-2 py-1 text-right focus:border-blue-400 focus:outline-none"
                />
                <span>/h</span>
              </label>
              <button
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() => removePicked(p.memberId)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
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
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={true}
            aria-label="Search members"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelAdding();
            }}
            placeholder="Search members..."
            className="w-full rounded border border-blue-400 px-3 py-2 text-sm ring-2 ring-blue-400/40 focus:outline-none"
          />
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
      ) : (
        <button
          type="button"
          onClick={startAdding}
          className="w-full rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          + Add member
        </button>
      )}
    </div>
  );
});
