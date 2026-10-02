import type {
  ApplicationDetail,
  ApplicationStatus,
  Interview,
  InterviewKind,
} from "@api/Application.api";
import type { ApplicationDetailTab } from "./ApplicationDetail.search";
import { toDisplayDate } from "../helpers/date";

export interface ApplicationDetailOverview {
  headline: string;
  status: ApplicationStatus;
  statusLabel: string;
  appliedAt: string;
  salary: string;
  notes: string;
}

export interface InterviewRow {
  id: string;
  kind: InterviewKind;
  kindLabel: string;
  scheduledAt: string;
  interviewer: string;
}

// This page's wording — the list keeps its own copy (ADR 0003).
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer received",
  rejected: "Rejected",
};

const KIND_LABELS: Record<InterviewKind, string> = {
  phone: "Phone screen",
  video: "Video call",
  onsite: "On-site",
};

const TAB_LABELS: Record<ApplicationDetailTab, string> = {
  overview: "Overview",
  interviews: "Interviews",
};

export const TAB_OPTIONS = (Object.entries(TAB_LABELS) as [ApplicationDetailTab, string][]).map(
  ([value, label]) => ({ value, label }),
);

// One caller, so the instant formatter stays here; the date half is shared.
const toDisplayInstant = (iso: string) =>
  `${toDisplayDate(iso.slice(0, 10))} ${iso.slice(11, 16)} UTC`;

export function toApplicationDetailOverview(detail: ApplicationDetail): ApplicationDetailOverview {
  return {
    headline: `${detail.position} at ${detail.companyName}`,
    status: detail.status,
    statusLabel: STATUS_LABELS[detail.status],
    appliedAt: toDisplayDate(detail.appliedAt),
    salary: detail.salary ?? "Not disclosed",
    notes: detail.notes || "No notes yet",
  };
}

export function toInterviewRow(interview: Interview): InterviewRow {
  return {
    id: interview.id,
    kind: interview.kind,
    kindLabel: KIND_LABELS[interview.kind],
    scheduledAt: toDisplayInstant(interview.scheduledAt),
    interviewer: interview.interviewer,
  };
}
