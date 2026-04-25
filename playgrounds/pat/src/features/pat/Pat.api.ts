import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Pat = components["schemas"]["Pat"];
export type CreatePatInput = components["schemas"]["CreatePatInput"];
export type UpdatePatInput = components["schemas"]["UpdatePatInput"];

export const patApi = {
  getAll: () => api.get("pats").json<Pat[]>(),
  create: (input: CreatePatInput) =>
    api.post("pats", { json: input }).json<Pat>(),
  update: (id: string, input: UpdatePatInput) =>
    api.patch(`pats/${id}`, { json: input }).json<Pat>(),
  delete: (id: string) => api.delete(`pats/${id}`),
};
