import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMembersFacade } from "../members/Members.facade";
import type { Member } from "../members/Members.api";

export interface PickedMember {
  memberId: string;
  name: string;
  hourlyRate: number;
}

export interface TeamMemberPickerPresenterProps {
  picked: PickedMember[];
  onAdd: (member: Member) => void;
  onRemove: (memberId: string) => void;
  onRateChange: (memberId: string, hourlyRate: number) => void;
}

export interface TeamMemberPickerPresenter {
  open: boolean;
  startAdding: () => void;
  cancelAdding: () => void;
  query: string;
  setQuery: (q: string) => void;
  candidates: Member[];
  isSearching: boolean;
  selectMember: (member: Member) => void;
  removePicked: (memberId: string) => void;
  setRate: (memberId: string, value: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useTeamMemberPickerPresenter({
  picked,
  onAdd,
  onRemove,
  onRateChange,
}: TeamMemberPickerPresenterProps): TeamMemberPickerPresenter {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { members, isFetching } = useMembersFacade({ q: query });

  const pickedIds = useMemo(
    () => new Set(picked.map((p) => p.memberId)),
    [picked],
  );

  const candidates = useMemo(
    () => members.filter((m) => !pickedIds.has(m.id)),
    [members, pickedIds],
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const startAdding = useCallback(() => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const cancelAdding = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const selectMember = useCallback(
    (member: Member) => {
      onAdd(member);
      setOpen(false);
      setQuery("");
    },
    [onAdd],
  );

  const removePicked = useCallback(
    (memberId: string) => {
      onRemove(memberId);
    },
    [onRemove],
  );

  const setRate = useCallback(
    (memberId: string, value: string) => {
      const parsed = Number.parseFloat(value);
      onRateChange(memberId, Number.isFinite(parsed) ? parsed : 0);
    },
    [onRateChange],
  );

  return {
    open,
    startAdding,
    cancelAdding,
    query,
    setQuery,
    candidates,
    isSearching: isFetching,
    selectMember,
    removePicked,
    setRate,
    containerRef,
    inputRef,
  };
}
