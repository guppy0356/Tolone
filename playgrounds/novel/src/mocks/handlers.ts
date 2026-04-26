import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths } from "../types/openapi";
import { books } from "./books-seed";

const http = createOpenApiHttp<paths>();

export const handlers = [
  http.post("/api/login", async ({ response }) => {
    await delay(400);
    return response(200).json({ token: "demo-token" });
  }),

  http.get("/api/books", async ({ response }) => {
    await delay(400);
    return response(200).json(
      books.map((b) => ({ id: b.id, title: b.title, author: b.author })),
    );
  }),

  http.get("/api/books/{id}", async ({ params, response }) => {
    await delay(400);
    const book = books.find((b) => b.id === params.id);
    if (!book) return response(404).empty();
    return response(200).json({
      id: book.id,
      title: book.title,
      author: book.author,
      summary: book.summary,
      totalPages: book.pages.length,
    });
  }),
];
