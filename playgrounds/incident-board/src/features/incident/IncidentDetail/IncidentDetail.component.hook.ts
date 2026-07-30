import { useMemo } from "react";
import type { IncidentComment, IncidentDetail } from "@api/Incident.api";
import type { IncidentDetailSearch } from "./IncidentDetail.search";
import {
  toCommentRow,
  toIncidentDetailHeadline,
  toTabLinks,
  toTimelineRow,
  type CommentRow,
  type IncidentDetailHeadline,
  type IncidentTabLink,
  type TimelineRow,
} from "./IncidentDetail.view-model";

export interface IncidentDetailComponentParams {
  detail: IncidentDetail;
  comments: IncidentComment[];
  search: IncidentDetailSearch;
}

export interface IncidentDetailComponentState {
  headline: IncidentDetailHeadline;
  tabs: IncidentTabLink[];
  timelineRows: TimelineRow[];
  commentRows: CommentRow[];
}

export function useIncidentDetailComponent({
  detail,
  comments,
  search,
}: IncidentDetailComponentParams): IncidentDetailComponentState {
  const headline = useMemo(() => toIncidentDetailHeadline(detail), [detail]);

  const tabs = useMemo(() => toTabLinks(search.tab), [search.tab]);

  const timelineRows = useMemo(
    () => detail.timeline.map(toTimelineRow),
    [detail.timeline],
  );

  const commentRows = useMemo(() => comments.map(toCommentRow), [comments]);

  return { headline, tabs, timelineRows, commentRows };
}
