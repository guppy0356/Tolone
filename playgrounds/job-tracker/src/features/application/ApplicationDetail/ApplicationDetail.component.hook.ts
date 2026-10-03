import { useMemo } from "react";
import type { ApplicationDetail, Interview } from "@api/Application.api";
import {
  toApplicationDetailOverview,
  toInterviewRow,
  type ApplicationDetailOverview,
  type InterviewRow,
} from "./ApplicationDetail.view-model";

export interface ApplicationDetailComponentParams {
  // Non-undefined: the body that calls this hook only renders once the detail is loaded.
  detail: ApplicationDetail;
  interviews: Interview[];
}

export interface ApplicationDetailComponentState {
  overview: ApplicationDetailOverview;
  interviewRows: InterviewRow[];
}

export function useApplicationDetailComponent({
  detail,
  interviews,
}: ApplicationDetailComponentParams): ApplicationDetailComponentState {
  const overview = useMemo(() => toApplicationDetailOverview(detail), [detail]);
  const interviewRows = useMemo(() => interviews.map(toInterviewRow), [interviews]);
  return { overview, interviewRows };
}
