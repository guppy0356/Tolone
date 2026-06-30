import { useCallback, useMemo, useState } from "react";
import type { Member } from "@api/Member.api";
import type { CreateTeamInput } from "@api/Team.api";

export interface PickedMember {
  memberId: string;
  name: string;
  hourlyRate: number;
}

export interface TeamFormPresenterProps {
  addTeam: (input: CreateTeamInput) => Promise<void>;
  onSaved?: () => void;
  members: Member[];
  setMemberSearch: (q: string) => void;
}

export interface TeamFormPresenter {
  teamName: string;
  setTeamName: (value: string) => void;
  picked: PickedMember[];
  addMember: (member: Member) => void;
  removeMember: (memberId: string) => void;
  setRate: (memberId: string, hourlyRate: number) => void;
  canSubmit: boolean;
  submitting: boolean;
  handleSubmit: () => Promise<void>;
  candidates: Member[];
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
}

export function useTeamFormPresenter({
  addTeam,
  onSaved,
  members,
  setMemberSearch,
}: TeamFormPresenterProps): TeamFormPresenter {
  const [teamName, setTeamName] = useState("");
  const [picked, setPicked] = useState<PickedMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const addMember = useCallback((member: Member) => {
    setPicked((prev) =>
      prev.some((p) => p.memberId === member.id)
        ? prev
        : [...prev, { memberId: member.id, name: member.name, hourlyRate: 0 }],
    );
  }, []);

  const removeMember = useCallback((memberId: string) => {
    setPicked((prev) => prev.filter((p) => p.memberId !== memberId));
  }, []);

  const setRate = useCallback((memberId: string, hourlyRate: number) => {
    setPicked((prev) =>
      prev.map((p) => (p.memberId === memberId ? { ...p, hourlyRate } : p)),
    );
  }, []);

  const pickedIds = useMemo(
    () => new Set(picked.map((p) => p.memberId)),
    [picked],
  );

  const candidates = useMemo(
    () => members.filter((m) => !pickedIds.has(m.id)),
    [members, pickedIds],
  );

  const openPicker = useCallback(() => {
    setIsPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
    setMemberSearch("");
  }, [setMemberSearch]);

  const canSubmit =
    teamName.trim().length > 0 &&
    picked.length > 0 &&
    picked.every((p) => p.hourlyRate > 0) &&
    !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await addTeam({
        name: teamName.trim(),
        members: picked.map((p) => ({
          memberId: p.memberId,
          hourlyRate: p.hourlyRate,
        })),
      });
      setTeamName("");
      setPicked([]);
      onSaved?.();
    } finally {
      setSubmitting(false);
    }
  }, [addTeam, canSubmit, onSaved, picked, teamName]);

  return {
    teamName,
    setTeamName,
    picked,
    addMember,
    removeMember,
    setRate,
    canSubmit,
    submitting,
    handleSubmit,
    candidates,
    isPickerOpen,
    openPicker,
    closePicker,
  };
}
