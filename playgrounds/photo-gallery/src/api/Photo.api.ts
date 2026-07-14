import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

export type Photo = components["schemas"]["Photo"];
export type PhotoPage = components["schemas"]["PhotoPage"];

export const photoApi = {
  getPage: (page: number, limit: number) =>
    api.get("photos", { searchParams: { page, limit } }).json<PhotoPage>(),
};
