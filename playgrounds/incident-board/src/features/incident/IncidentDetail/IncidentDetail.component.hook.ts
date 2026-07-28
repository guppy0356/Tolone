import { useMemo } from "react";
import type {
  IncidentComment,
  IncidentDetail,
  TimelineEvent,
} from "@api/Incident.api";
import {
  formatInstant,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "../Incident.labels";
import {
  INCIDENT_TABS,
  type IncidentDetailSearch,
  type IncidentTab,
} from "../Incident.search";

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

export interface IncidentHeadline {
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

export interface IncidentDetailComponentParams {
  detail: IncidentDetail;
  comments: IncidentComment[];
  search: IncidentDetailSearch;
}

export interface IncidentDetailComponentState {
  headline: IncidentHeadline;
  tabs: IncidentTabLink[];
  timelineRows: TimelineRow[];
  commentRows: CommentRow[];
}

export function useIncidentDetailComponent({
  detail,
  comments,
  search,
}: IncidentDetailComponentParams): IncidentDetailComponentState {
  const headline = useMemo<IncidentHeadline>(
    () => ({
      key: detail.key,
      title: detail.title,
      description: detail.description,
      statusLabel: STATUS_LABELS[detail.status],
      severityLabel: SEVERITY_LABELS[detail.severity],
      assigneeLabel: detail.assignee?.name ?? "Unassigned",
      openedAtLabel: formatInstant(detail.openedAt),
    }),
    [detail],
  );

  const tabs = useMemo<IncidentTabLink[]>(
    () =>
      INCIDENT_TABS.map((value) => ({
        value,
        label: TAB_LABELS[value],
        isActive: value === search.tab,
      })),
    [search.tab],
  );

  const timelineRows = useMemo<TimelineRow[]>(
    () =>
      detail.timeline.map((event) => ({
        id: event.id,
        atLabel: formatInstant(event.at),
        kindLabel: KIND_LABELS[event.kind],
        actor: event.actor,
        message: event.message,
      })),
    [detail.timeline],
  );

  const commentRows = useMemo<CommentRow[]>(
    () =>
      comments.map((comment) => ({
        id: comment.id,
        author: comment.author,
        postedAtLabel: formatInstant(comment.postedAt),
        body: comment.body,
      })),
    [comments],
  );

  return { headline, tabs, timelineRows, commentRows };
}
