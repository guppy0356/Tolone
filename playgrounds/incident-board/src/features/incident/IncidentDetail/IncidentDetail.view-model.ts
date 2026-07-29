import type {
  IncidentComment,
  IncidentDetail,
  TimelineEvent,
} from "@api/Incident.api";
import { SEVERITY_LABELS, STATUS_LABELS } from "../Incident.labels";
import { formatInstant } from "../helpers/instant";
import { INCIDENT_TABS, type IncidentTab } from "../Incident.search";

// Only this page renders the tabs and the timeline, so their wording stays here.
const TAB_LABELS: Record<IncidentTab, string> = {
  timeline: "Timeline",
  comments: "Comments",
};

const KIND_LABELS: Record<TimelineEvent["kind"], string> = {
  opened: "Opened",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  note: "Note",
};

export interface IncidentDetailHeadline {
  key: string;
  title: string;
  description: string;
  statusLabel: string;
  severityLabel: string;
  assigneeLabel: string;
  openedAtLabel: string;
}

export interface IncidentTabLink {
  value: IncidentTab;
  label: string;
  isActive: boolean;
}

export interface TimelineRow {
  id: string;
  atLabel: string;
  kindLabel: string;
  actor: string;
  message: string;
}

export interface CommentRow {
  id: string;
  author: string;
  postedAtLabel: string;
  body: string;
}

export function toIncidentDetailHeadline(
  detail: IncidentDetail,
): IncidentDetailHeadline {
  return {
    key: detail.key,
    title: detail.title,
    description: detail.description,
    statusLabel: STATUS_LABELS[detail.status],
    severityLabel: SEVERITY_LABELS[detail.severity],
    assigneeLabel: detail.assignee?.name ?? "Unassigned",
    openedAtLabel: formatInstant(detail.openedAt),
  };
}

export function toTimelineRow(event: TimelineEvent): TimelineRow {
  return {
    id: event.id,
    atLabel: formatInstant(event.at),
    kindLabel: KIND_LABELS[event.kind],
    actor: event.actor,
    message: event.message,
  };
}

export function toCommentRow(comment: IncidentComment): CommentRow {
  return {
    id: comment.id,
    author: comment.author,
    postedAtLabel: formatInstant(comment.postedAt),
    body: comment.body,
  };
}

export function toTabLinks(activeTab: IncidentTab): IncidentTabLink[] {
  return INCIDENT_TABS.map((value) => ({
    value,
    label: TAB_LABELS[value],
    isActive: value === activeTab,
  }));
}
