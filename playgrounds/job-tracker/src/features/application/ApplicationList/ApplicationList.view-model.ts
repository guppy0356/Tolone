import type { ApplicationSort, ApplicationStatus, ApplicationSummary } from "@api/Application.api";
import { toDisplayDate } from "../helpers/date";

export interface ApplicationListRow {
  id: string;
  companyName: string;
  position: string;
  // The raw member rides beside its label: the Component keys its status tone
  // from it, beside the JSX. A className never comes from this file.
  status: ApplicationStatus;
  statusLabel: string;
  appliedAt: string;
}

// This page's wording. The detail page keeps its own copy. Exhaustive over
// ApplicationStatus, so a status added to the contract breaks the build here
// until it has been given a name.
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const SORT_LABELS: Record<ApplicationSort, string> = {
  "-appliedAt": "Newest first",
  appliedAt: "Oldest first",
  company: "Company A–Z",
};

// Depend on neither server data nor current state — constants, not memos.
// The order is each table's, not the generated array's.
export const STATUS_OPTIONS = (Object.entries(STATUS_LABELS) as [ApplicationStatus, string][]).map(
  ([value, label]) => ({ value, label }),
);

export const SORT_OPTIONS = (Object.entries(SORT_LABELS) as [ApplicationSort, string][]).map(
  ([value, label]) => ({ value, label }),
);

export function toApplicationListRow(application: ApplicationSummary): ApplicationListRow {
  return {
    id: application.id,
    companyName: application.companyName,
    position: application.position,
    status: application.status,
    statusLabel: STATUS_LABELS[application.status],
    appliedAt: toDisplayDate(application.appliedAt),
  };
}
