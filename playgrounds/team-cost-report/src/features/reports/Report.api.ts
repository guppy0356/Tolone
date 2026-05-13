import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type ReportSummary = components["schemas"]["ReportSummary"];
export type CreateReportInput = components["schemas"]["CreateReportInput"];

// The server emits one numeric key per team name on each row plus `month`.
// Team names aren't known at schema time so we widen here.
export type MonthlyPaymentRow = { month: string } & Record<string, number | string>;

export type ReportDetail = Omit<
  components["schemas"]["ReportDetail"],
  "monthly"
> & {
  monthly: MonthlyPaymentRow[];
};

export const reportApi = {
  getAll: () => api.get("reports").json<ReportSummary[]>(),
  create: (input: CreateReportInput) =>
    api.post("reports", { json: input }).json<ReportSummary>(),
  getDetail: (id: string) => api.get(`reports/${id}`).json<ReportDetail>(),
};
