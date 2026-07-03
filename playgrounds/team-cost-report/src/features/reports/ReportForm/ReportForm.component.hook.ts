import { useCallback } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportFormSchema, type ReportFormValues } from "./ReportForm.schema";
import type { ReportSummary } from "@api/Report.api";
import type { ReportFormContainerState } from "./ReportForm.container.hook";

// Plain field object so the Component never imports react-hook-form.
export interface ReportFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

export interface ReportFormComponentParams {
  addReport: ReportFormContainerState["addReport"];
  onSaved: (report: ReportSummary) => void;
}

export interface ReportFormComponentState {
  nameField: ReportFormField;
  selectedTeamIds: string[];
  teamIdsError: string | undefined;
  toggleTeam: (teamId: string) => void;
  isTeamSelected: (teamId: string) => boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
}

export function useReportFormComponent({
  addReport,
  onSaved,
}: ReportFormComponentParams): ReportFormComponentState {
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { isValid, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    mode: "onChange",
    defaultValues: { name: "", teamIds: [] },
  });

  const nameCtrl = useController({ name: "name", control });
  const nameField: ReportFormField = {
    value: nameCtrl.field.value,
    onChange: (v) => nameCtrl.field.onChange(v),
    onBlur: nameCtrl.field.onBlur,
    error: nameCtrl.fieldState.error?.message,
  };

  const teamIdsCtrl = useController({ name: "teamIds", control });
  const selectedTeamIds = teamIdsCtrl.field.value;

  const toggleTeam = (teamId: string) => {
    teamIdsCtrl.field.onChange(
      selectedTeamIds.includes(teamId)
        ? selectedTeamIds.filter((id) => id !== teamId)
        : [...selectedTeamIds, teamId],
    );
  };

  const isTeamSelected = (teamId: string) => selectedTeamIds.includes(teamId);

  // handleSubmit receives the schema's parsed output, so `name` arrives
  // already trimmed — the schema, not the handler, owns normalization.
  const onSubmit = useCallback(
    async (data: ReportFormValues) => {
      const created = await addReport(data);
      reset({ name: "", teamIds: [] });
      onSaved(created);
    },
    [addReport, reset, onSaved],
  );

  const handleSubmit = useCallback(
    () => rhfHandleSubmit(onSubmit)(),
    [rhfHandleSubmit, onSubmit],
  );

  return {
    nameField,
    selectedTeamIds,
    teamIdsError: teamIdsCtrl.fieldState.error?.message,
    toggleTeam,
    isTeamSelected,
    canSubmit: isValid && !isSubmitting,
    isSubmitting,
    handleSubmit,
  };
}
