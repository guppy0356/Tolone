import { memo, useEffect, useRef } from "react";
import type { Company } from "@api/Company.api";

export interface CompanyPickerProps {
  selected: Company | null;
  keyword: string;
  onKeywordChange: (value: string) => void;
  companies: Company[];
  isSearching: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (company: Company) => void;
  error: string | undefined;
}

// Typeahead picker over the Company resource. Whether it is open is the
// form's state (component hook); the click-outside mechanics are its own.
export const CompanyPicker = memo(function CompanyPicker({
  selected,
  keyword,
  onKeywordChange,
  companies,
  isSearching,
  isOpen,
  onOpen,
  onClose,
  onSelect,
  error,
}: CompanyPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, onClose]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={isOpen ? onClose : onOpen}
        aria-expanded={isOpen}
        aria-label="Company"
        className="w-full rounded border px-3 py-2 text-left"
      >
        {selected ? selected.name : <span className="text-gray-400">Choose a company</span>}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-white p-2 shadow">
          <input
            type="search"
            autoFocus
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Search companies"
            className="mb-2 w-full rounded border px-2 py-1"
          />
          {isSearching ? (
            <p className="px-2 py-1 text-sm text-gray-500">Searching…</p>
          ) : keyword.trim() === "" ? (
            <p className="px-2 py-1 text-sm text-gray-500">Type to search</p>
          ) : companies.length === 0 ? (
            <p className="px-2 py-1 text-sm text-gray-500">No companies match</p>
          ) : (
            <ul role="listbox">
              {companies.map((company) => (
                <li key={company.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected?.id === company.id}
                    onClick={() => onSelect(company)}
                    className="w-full rounded px-2 py-1 text-left hover:bg-gray-100"
                  >
                    {company.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});
