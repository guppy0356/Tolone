import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

export type Superior = components["schemas"]["Superior"];

export const superiorApi = {
  getAll: () => api.get("superiors").json<Superior[]>(),
};
