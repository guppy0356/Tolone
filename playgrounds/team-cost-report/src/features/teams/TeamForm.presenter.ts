import { useCallback, useState } from "react";
import type { Member } from "../members/Members.api";
import type { CreateTeamInput } from "./Team.api";
import type { PickedMember } from "./TeamMemberPicker.presenter";

export interface TeamFormPresenterProps {
  addTeam: (input: CreateTeamInput) => Promise<void>;
  onSaved?: () => void;
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
}

export function useTeamFormPresenter({
  addTeam,
  onSaved,
}: TeamFormPresenterProps): TeamFormPresenter {
  const [teamName, setTeamName] = useState("");
  const [picked, setPicked] = useState<PickedMember[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
  };
}
