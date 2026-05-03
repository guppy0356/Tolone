import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths } from "../types/openapi";
import { books } from "./books-seed";

const http = createOpenApiHttp<paths>();

const PREVIEW_PAGE_LIMIT = 3;

const bookmarks = new Map<string, Map<string, number>>();

function getAuthToken(cookies: Record<string, string>): string | null {
  const value = cookies.novelAuth;
  return value && value !== "" ? value : null;
}

function getBookmark(token: string, bookId: string): number {
  return bookmarks.get(token)?.get(bookId) ?? 1;
}

function setBookmark(token: string, bookId: string, page: number): void {
  let userBookmarks = bookmarks.get(token);
  if (!userBookmarks) {
    userBookmarks = new Map();
    bookmarks.set(token, userBookmarks);
  }
  userBookmarks.set(bookId, page);
}

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

  http.get("/api/books/{id}", async ({ cookies, params, response }) => {
    await delay(400);
    const token = getAuthToken(cookies);
    if (!token) return response(401).empty();
    const book = books.find((b) => b.id === params.id);
    if (!book) return response(404).empty();
    const currentPage = getBookmark(token, book.id);
    const totalPages = book.pages.length + 1;
    const pageContent = currentPage === 1 ? book.summary : book.pages[currentPage - 2];
    return response(200).json({
      id: book.id,
      title: book.title,
      author: book.author,
      summary: book.summary,
      totalPages,
      currentPage,
      pageContent,
    });
  }),

  http.get("/api/preview-books/{id}", async ({ params, response }) => {
    await delay(400);
    const book = books.find((b) => b.id === params.id);
    if (!book) return response(404).empty();
    const totalPages = book.pages.length + 1;
    const summaryPage = { number: 1, totalPages, content: book.summary };
    const contentPages = book.pages.slice(0, PREVIEW_PAGE_LIMIT).map((content, i) => ({
      number: i + 2,
      totalPages,
      content,
    }));
    return response(200).json({
      id: book.id,
      title: book.title,
      author: book.author,
      summary: book.summary,
      totalPages,
      pages: [summaryPage, ...contentPages],
    });
  }),

  http.post("/api/books/{id}/next", async ({ cookies, params, response }) => {
    await delay(150);
    const token = getAuthToken(cookies);
    if (!token) return response(401).empty();
    const book = books.find((b) => b.id === params.id);
    if (!book) return response(404).empty();
    const totalPages = book.pages.length + 1;
    const current = getBookmark(token, book.id);
    const next = Math.min(current + 1, totalPages);
    setBookmark(token, book.id, next);
    const content = next === 1 ? book.summary : book.pages[next - 2];
    return response(200).json({
      page: next,
      totalPages,
      content,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.post("/api/books/{id}/prev", async ({ cookies, params, response }) => {
    await delay(150);
    const token = getAuthToken(cookies);
    if (!token) return response(401).empty();
    const book = books.find((b) => b.id === params.id);
    if (!book) return response(404).empty();
    const totalPages = book.pages.length + 1;
    const current = getBookmark(token, book.id);
    const prev = Math.max(current - 1, 1);
    setBookmark(token, book.id, prev);
    const content = prev === 1 ? book.summary : book.pages[prev - 2];
    return response(200).json({
      page: prev,
      totalPages,
      content,
      updatedAt: new Date().toISOString(),
    });
  }),
];
