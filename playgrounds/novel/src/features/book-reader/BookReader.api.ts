import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Book = components["schemas"]["Book"];
export type Page = components["schemas"]["Page"];
export type Bookmark = components["schemas"]["Bookmark"];

export const bookReaderApi = {
  getBook: (id: string) => api.get(`books/${id}`).json<Book>(),
  getPage: (bookId: string, pageNumber: number) =>
    api.get(`books/${bookId}/pages/${pageNumber}`).json<Page>(),
  nextPage: (bookId: string) =>
    api.post(`books/${bookId}/next`).json<Bookmark>(),
  prevPage: (bookId: string) =>
    api.post(`books/${bookId}/prev`).json<Bookmark>(),
};
