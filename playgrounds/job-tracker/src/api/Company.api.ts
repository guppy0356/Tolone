import { api } from "../lib/api-client";
import type { Company } from "../lib/api.gen";

export type { Company };

export const companyApi = {
  search: (q: string): Promise<Company[]> => api.get("/api/companies", { query: { q } }),
};
