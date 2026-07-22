import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

export type TravelRequest = components["schemas"]["TravelRequest"];
export type TravelRequestDetail = components["schemas"]["TravelRequestDetail"];
export type TravelRequestStatus = components["schemas"]["TravelRequestStatus"];
export type ExpenseItem = components["schemas"]["ExpenseItem"];
export type ApproveInput = components["schemas"]["ApproveInput"];

export const travelRequestApi = {
  getAll: () => api.get("travel-requests").json<TravelRequest[]>(),
  getDetail: (id: string) =>
    api.get(`travel-requests/${id}`).json<TravelRequestDetail>(),
  approve: (id: string, input: ApproveInput) =>
    api
      .post(`travel-requests/${id}/approve`, { json: input })
      .json<TravelRequestDetail>(),
  reject: (id: string) =>
    api.post(`travel-requests/${id}/reject`).json<TravelRequestDetail>(),
};
