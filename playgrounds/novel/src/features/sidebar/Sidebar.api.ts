import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type BookSummary = components["schemas"]["BookSummary"];

export const sidebarApi = {
  getBooks: () => api.get("books").json<BookSummary[]>(),
};
