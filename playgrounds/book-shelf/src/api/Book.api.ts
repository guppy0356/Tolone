import { api } from "../lib/api-client";
import type { Book, CreateBookInput } from "../lib/api.gen";

export type { Book, CreateBookInput };

export const bookApi = {
  create: (input: CreateBookInput): Promise<Book> =>
    api.post("/api/books", { body: input }),
};
