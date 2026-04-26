import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Page = components["schemas"]["Page"];

export const bookReaderApi = {
  getPage: (bookId: string, pageNumber: number) =>
    api.get(`books/${bookId}/pages/${pageNumber}`).json<Page>(),
};
