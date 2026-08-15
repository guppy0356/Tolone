import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

export type User = components["schemas"]["User"];

export const userApi = {
  getAll: (): Promise<User[]> => api.get("/api/users"),
};
