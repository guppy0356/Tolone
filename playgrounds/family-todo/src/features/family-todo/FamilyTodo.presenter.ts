import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { FamilyMember, FamilyTodo } from "./FamilyTodo.api";
import { FAMILY_MEMBERS } from "./FamilyTodo.api";
import type { FamilyTodoFacade } from "./FamilyTodo.facade";

export interface FamilyTodoPresenter {
  currentUser: FamilyMember;
  setCurrentUser: (member: FamilyMember) => void;
  todos: FamilyTodo[];
  isFilterPending: boolean;
  selectedMembers: FamilyTodoFacade["selectedMembers"];
  toggleMemberSelection: FamilyTodoFacade["toggleMemberSelection"];
  removeMember: FamilyTodoFacade["removeMember"];
  filterSearch: string;
  setFilterSearch: (value: string) => void;
  filterOpen: boolean;
  toggleFilter: () => void;
  filteredMemberOptions: FamilyMember[];
  filterRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
  isOwnTodo: (todo: FamilyTodo) => boolean;
  toggleTodo: FamilyTodoFacade["toggleTodo"];
  deleteTodo: FamilyTodoFacade["deleteTodo"];
}

export function useFamilyTodoPresenter({
  todos,
  isFilterPending,
  currentUser,
  setCurrentUser,
  selectedMembers,
  toggleMemberSelection,
  removeMember,
  addTodo,
  toggleTodo,
  deleteTodo,
}: FamilyTodoFacade): FamilyTodoPresenter {
  const [newTitle, setNewTitle] = useState("");
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

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed, owner: currentUser });
    setNewTitle("");
  }, [newTitle, addTodo, currentUser]);

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

  const isOwnTodo = useCallback(
    (todo: FamilyTodo) => todo.owner === currentUser,
    [currentUser],
  );

  return {
    currentUser,
    setCurrentUser,
    todos,
    isFilterPending,
    selectedMembers,
    toggleMemberSelection,
    removeMember,
    filterSearch,
    setFilterSearch,
    filterOpen,
    toggleFilter,
    filteredMemberOptions,
    filterRef,
    inputRef,
    newTitle,
    setNewTitle,
    handleSubmit,
    isOwnTodo,
    toggleTodo,
    deleteTodo,
  };
}
