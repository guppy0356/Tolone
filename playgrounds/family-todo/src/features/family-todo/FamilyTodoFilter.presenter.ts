import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { FamilyMember } from "./FamilyTodo.api";
import { FAMILY_MEMBERS } from "./FamilyTodo.api";

export interface FamilyTodoFilterProps {
  selectedMembers: FamilyMember[];
  selectMember: (member: FamilyMember) => void;
}

export interface FamilyTodoFilterPresenter {
  filterSearch: string;
  setFilterSearch: (value: string) => void;
  filterOpen: boolean;
  toggleFilter: () => void;
  filteredMemberOptions: FamilyMember[];
  filterRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useFamilyTodoFilterPresenter(): FamilyTodoFilterPresenter {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const filterRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
        setFilterSearch("");
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  const filteredMemberOptions = useMemo(() => {
    if (!filterSearch.trim()) return FAMILY_MEMBERS;
    const q = filterSearch.toLowerCase();
    return FAMILY_MEMBERS.filter((m) => m.toLowerCase().includes(q));
  }, [filterSearch]);

  const toggleFilter = useCallback(() => {
    setFilterOpen((prev) => {
      if (prev) {
        setFilterSearch("");
      } else {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return !prev;
    });
  }, []);

  return {
    filterSearch,
    setFilterSearch,
    filterOpen,
    toggleFilter,
    filteredMemberOptions,
    filterRef,
    inputRef,
  };
}
