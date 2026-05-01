import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Book = components["schemas"]["Book"];
export type Page = components["schemas"]["Page"];
export type Bookmark = components["schemas"]["Bookmark"];

export const bookReaderApi = {
  getBook: (id: string) => api.get(`books/${id}`).json<Book>(),
  nextPage: (bookId: string) => api.post(`books/${bookId}/next`).json<Bookmark>(),
  prevPage: (bookId: string) => api.post(`books/${bookId}/prev`).json<Bookmark>(),
};
