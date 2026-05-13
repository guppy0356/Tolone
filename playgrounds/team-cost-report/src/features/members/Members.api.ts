import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Member = components["schemas"]["Member"];

export const membersApi = {
  getAll: (q?: string) => {
    const searchParams = q ? { q } : undefined;
    return api.get("members", { searchParams }).json<Member[]>();
  },
};
