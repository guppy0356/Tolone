import { api } from "../lib/api-client";
import type { User } from "../lib/api.gen";

export type { User } from "../lib/api.gen";

export const userApi = {
  getAll: (): Promise<User[]> => api.get("/api/users"),
};
