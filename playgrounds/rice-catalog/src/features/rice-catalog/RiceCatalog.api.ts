import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Rice = components["schemas"]["Rice"];
export type RiceFilters = components["schemas"]["RiceFilters"];

export interface RiceSearchParams {
  search?: string;
  brand?: string;
  producer?: string;
  region?: string;
}

export const riceCatalogApi = {
  getAll: (params?: RiceSearchParams) =>
    api.get("rices", { searchParams: stripEmpty(params) }).json<Rice[]>(),
  getFilters: (params?: RiceSearchParams) =>
    api
      .get("rices/filters", { searchParams: stripEmpty(params) })
      .json<RiceFilters>(),
};

function stripEmpty(
  params?: RiceSearchParams,
): Record<string, string> | undefined {
  if (!params) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value) result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
