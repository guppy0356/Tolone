import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

export type ReportSummary = components["schemas"]["ReportSummary"];
export type CreateReportInput = components["schemas"]["CreateReportInput"];
export type ReportDetail = components["schemas"]["ReportDetail"];
export type MonthlyPayment = components["schemas"]["MonthlyPayment"];
export type TeamPayment = components["schemas"]["TeamPayment"];

export const reportApi = {
  getAll: () => api.get("reports").json<ReportSummary[]>(),
  create: (input: CreateReportInput) =>
    api.post("reports", { json: input }).json<ReportSummary>(),
  getDetail: (id: string) => api.get(`reports/${id}`).json<ReportDetail>(),
};
