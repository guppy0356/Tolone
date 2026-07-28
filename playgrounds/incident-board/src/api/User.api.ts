import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

export type User = components["schemas"]["User"];

export const userApi = {
  getAll: () => api.get("users").json<User[]>(),
};
