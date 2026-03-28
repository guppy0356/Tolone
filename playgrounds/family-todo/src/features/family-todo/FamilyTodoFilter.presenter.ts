import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { FamilyMember } from "./FamilyTodo.api";
import { FAMILY_MEMBERS } from "./FamilyTodo.api";

export interface FamilyTodoFilterProps {
  selectedMembers: FamilyMember[];
  filterTodos: (members: FamilyMember[]) => void;
}

export interface FamilyTodoFilterPresenter {
  filterSearch: string;
  setFilterSearch: (value: string) => void;
  filterOpen: boolean;
  toggleFilter: () => void;
  filteredMemberOptions: FamilyMember[];
  filterRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  selectMember: (member: FamilyMember) => void;
  removeMember: (member: FamilyMember) => void;
}

export function useFamilyTodoFilterPresenter({
  selectedMembers,
  filterTodos,
}: FamilyTodoFilterProps): FamilyTodoFilterPresenter {
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

  const selectMember = useCallback(
    (member: FamilyMember) => {
      const next = selectedMembers.includes(member)
        ? selectedMembers.filter((m) => m !== member)
        : [...selectedMembers, member];
      filterTodos(next);
    },
    [selectedMembers, filterTodos],
  );

  const removeMember = useCallback(
    (member: FamilyMember) => {
      filterTodos(selectedMembers.filter((m) => m !== member));
    },
    [selectedMembers, filterTodos],
  );

  return {
    filterSearch,
    setFilterSearch,
    filterOpen,
    toggleFilter,
    filteredMemberOptions,
    filterRef,
    inputRef,
    selectMember,
    removeMember,
  };
}
