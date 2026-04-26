import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Book = components["schemas"]["Book"];

export const bookPreviewApi = {
  getBook: (id: string) => api.get(`books/${id}`).json<Book>(),
};
