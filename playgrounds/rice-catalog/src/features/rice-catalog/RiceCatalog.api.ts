import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Rice = components["schemas"]["Rice"];

export const riceCatalogApi = {
  getAll: () => api.get("rices").json<Rice[]>(),
};
