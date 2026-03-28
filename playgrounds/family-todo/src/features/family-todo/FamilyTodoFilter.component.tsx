import { memo } from "react";
import {
  useFamilyTodoFilterPresenter,
  type FamilyTodoFilterProps,
} from "./FamilyTodoFilter.presenter";
import { MEMBER_AVATARS } from "./member-avatars";

export const FamilyTodoFilter = memo(function FamilyTodoFilter({
  selectedMembers,
  toggleMemberSelection,
  removeMember,
}: FamilyTodoFilterProps) {
  const {
    filterSearch,
    setFilterSearch,
    filterOpen,
    toggleFilter,
    filteredMemberOptions,
    filterRef,
    inputRef,
  } = useFamilyTodoFilterPresenter();

  return (
    <div ref={filterRef} className="relative mb-4">
      <div
        role="combobox"
        aria-expanded={filterOpen}
        aria-label="Filter by member"
        tabIndex={0}
        onClick={toggleFilter}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFilter();
          }
        }}
        className={`flex min-h-[38px] w-full cursor-pointer items-center gap-2 rounded border px-3 py-1.5 text-left text-sm transition-colors ${
          filterOpen
            ? "border-blue-400 ring-2 ring-blue-400/40"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selectedMembers.length > 0 ? (
            selectedMembers.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-gray-700"
              >
                <span className="shrink-0">{MEMBER_AVATARS[m]}</span>
                {m}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${m}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMember(m);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      removeMember(m);
                    }
                  }}
                  className="ml-0.5 cursor-pointer rounded-sm p-0 transition-colors hover:bg-gray-200"
                >
                  <svg
                    className="h-3 w-3 text-gray-500"
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
                </span>
              </span>
            ))
          ) : (
            <span className="text-gray-400">All members</span>
          )}
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${filterOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {filterOpen && (
        <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
          <div className="border-b px-3 py-2.5">
            <input
              ref={inputRef}
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredMemberOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No members found
              </div>
            ) : (
              filteredMemberOptions.map((m) => {
                const selected = selectedMembers.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMemberSelection(m)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-blue-50 ${
                      selected ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <span className="flex w-4 shrink-0 items-center justify-center">
                      {selected && (
                        <svg
                          className="h-3.5 w-3.5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm">
                      {MEMBER_AVATARS[m]}
                    </span>
                    <span className="flex-1 truncate text-gray-700">{m}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});
