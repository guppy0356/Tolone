import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Book = components["schemas"]["Book"];
export type Page = components["schemas"]["Page"];

export const bookPreviewApi = {
  getBook: (id: string) => api.get(`books/${id}`).json<Book>(),
  getPage: (id: string, pageNumber: number) =>
    api.get(`books/${id}/pages/${pageNumber}`).json<Page>(),
};
