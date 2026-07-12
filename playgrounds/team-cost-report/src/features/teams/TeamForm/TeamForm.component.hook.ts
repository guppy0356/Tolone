import { useCallback, useMemo, useState } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamFormSchema, type TeamFormValues } from "./TeamForm.schema";
import type { Member } from "@api/Member.api";
import type { TeamFormContainerState } from "./TeamForm.container.hook";

// Plain field object so the Component never imports react-hook-form.
export interface TeamFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

// View model for the picked-members list. The form value carries only the
// API contract ({ memberId, hourlyRate }); the display name is recorded when
// the member is picked, because the member may have dropped out of the
// server-filtered candidates since. `rateError` is the per-row validation
// message (plain string), so the rhf error object never crosses the boundary.
export interface PickedMember {
  memberId: string;
  name: string;
  hourlyRate: number;
  rateError: string | undefined;
}

export interface TeamFormComponentParams {
  addTeam: TeamFormContainerState["addTeam"];
  setMemberSearch: TeamFormContainerState["setMemberSearch"];
  members: Member[];
  onSaved: () => void;
}

export interface TeamFormComponentState {
  nameField: TeamFormField;
  picked: PickedMember[];
  membersError: string | undefined;
  addMember: (member: Member) => void;
  removeMember: (memberId: string) => void;
  setRate: (memberId: string, hourlyRate: number) => void;
  candidates: Member[];
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}

export function useTeamFormComponent({
  addTeam,
  setMemberSearch,
  members,
  onSaved,
}: TeamFormComponentParams): TeamFormComponentState {
  const {
    control,
    getValues,
    setValue,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { isValid, isSubmitting },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    mode: "onChange",
    defaultValues: { name: "", members: [] },
  });

  const nameCtrl = useController({ name: "name", control });
  const nameField: TeamFormField = {
    value: nameCtrl.field.value,
    onChange: (v) => nameCtrl.field.onChange(v),
    onBlur: nameCtrl.field.onBlur,
    error: nameCtrl.fieldState.error?.message,
  };

  const membersCtrl = useController({ name: "members", control });
  const pickedInputs = membersCtrl.field.value;

  // react-hook-form keeps two error shapes on this one field. The array-level
  // min(1) error arrives as a `.message`; per-element errors (a member's
  // non-positive rate) arrive as an array indexed by position. They never
  // coexist — min(1) only fails on an empty array — so both are read off the
  // same field state, the per-element one by indexing it as an array.
  const membersFieldError = membersCtrl.fieldState.error;
  const rateErrors = membersFieldError as unknown as
    | ({ hourlyRate?: { message?: string } } | undefined)[]
    | undefined;

  // Names of everyone picked so far, keyed by id — kept outside the form
  // values so the submitted payload stays exactly the API contract.
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  const picked = useMemo(
    () =>
      pickedInputs.map((m, i) => ({
        ...m,
        name: memberNames[m.memberId] ?? m.memberId,
        rateError: Array.isArray(rateErrors)
          ? rateErrors[i]?.hourlyRate?.message
          : undefined,
      })),
    [pickedInputs, memberNames, rateErrors],
  );

  // getValues/setValue are referentially stable, so these callbacks stay
  // stable for the memo'd sub-components (unlike field.onChange).
  const setMembers = useCallback(
    (next: TeamFormValues["members"]) => {
      setValue("members", next, { shouldValidate: true, shouldDirty: true });
    },
    [setValue],
  );

  const addMember = useCallback(
    (member: Member) => {
      const current = getValues("members");
      if (current.some((m) => m.memberId === member.id)) return;
      setMemberNames((prev) => ({ ...prev, [member.id]: member.name }));
      setMembers([...current, { memberId: member.id, hourlyRate: 0 }]);
    },
    [getValues, setMembers],
  );

  const removeMember = useCallback(
    (memberId: string) => {
      setMembers(getValues("members").filter((m) => m.memberId !== memberId));
    },
    [getValues, setMembers],
  );

  const setRate = useCallback(
    (memberId: string, hourlyRate: number) => {
      setMembers(
        getValues("members").map((m) =>
          m.memberId === memberId ? { ...m, hourlyRate } : m,
        ),
      );
    },
    [getValues, setMembers],
  );

  const candidates = useMemo(
    () => members.filter((m) => !pickedInputs.some((p) => p.memberId === m.id)),
    [members, pickedInputs],
  );

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const openPicker = useCallback(() => {
    setIsPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
    setMemberSearch("");
  }, [setMemberSearch]);

  // handleSubmit receives the schema's parsed output, so `name` arrives
  // already trimmed — the schema, not the handler, owns normalization.
  const onSubmit = useCallback(
    async (data: TeamFormValues) => {
      await addTeam(data);
      reset({ name: "", members: [] });
      setMemberNames({});
      onSaved();
    },
    [addTeam, reset, onSaved],
  );

  const handleSubmit = useCallback(
    () => rhfHandleSubmit(onSubmit)(),
    [rhfHandleSubmit, onSubmit],
  );

  return {
    nameField,
    picked,
    membersError: membersFieldError?.message,
    addMember,
    removeMember,
    setRate,
    candidates,
    isPickerOpen,
    openPicker,
    closePicker,
    canSubmit: isValid && !isSubmitting,
    isSubmitting,
    handleSubmit,
  };
}
