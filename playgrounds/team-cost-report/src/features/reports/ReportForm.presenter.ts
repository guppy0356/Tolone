import { useCallback, useState } from "react";
import type { CreateReportInput, ReportSummary } from "@api/Report.api";

export interface ReportFormPresenterProps {
  addReport: (input: CreateReportInput) => Promise<ReportSummary>;
  onSaved?: (report: ReportSummary) => void;
}

export interface ReportFormPresenter {
  reportName: string;
  setReportName: (value: string) => void;
  selectedTeamIds: string[];
  toggleTeam: (teamId: string) => void;
  isTeamSelected: (teamId: string) => boolean;
  canSubmit: boolean;
  submitting: boolean;
  handleSubmit: () => Promise<void>;
}

export function useReportFormPresenter({
  addReport,
  onSaved,
}: ReportFormPresenterProps): ReportFormPresenter {
  const [reportName, setReportName] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTeam = useCallback((teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId],
    );
  }, []);

  const isTeamSelected = useCallback(
    (teamId: string) => selectedTeamIds.includes(teamId),
    [selectedTeamIds],
  );

  const canSubmit =
    reportName.trim().length > 0 && selectedTeamIds.length > 0 && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const created = await addReport({
        name: reportName.trim(),
        teamIds: selectedTeamIds,
      });
      setReportName("");
      setSelectedTeamIds([]);
      onSaved?.(created);
    } finally {
      setSubmitting(false);
    }
  }, [addReport, canSubmit, onSaved, reportName, selectedTeamIds]);

  return {
    reportName,
    setReportName,
    selectedTeamIds,
    toggleTeam,
    isTeamSelected,
    canSubmit,
    submitting,
    handleSubmit,
  };
}
