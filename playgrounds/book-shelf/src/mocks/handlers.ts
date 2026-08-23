import { delay } from "msw";
import type { Book } from "../lib/api.gen";
import { http } from "./typed-http";

// Stands in for the lookup the server runs on an ISBN-13. Anything not listed
// still registers, under a placeholder title.
const CATALOGUE: Record<
  string,
  Pick<Book, "title" | "coverUrl" | "authors" | "publisher">
> = {
  "9784873119045": {
    title: "リーダブルコード",
    coverUrl: "https://placehold.co/120x180?text=Readable+Code",
    authors: ["Dustin Boswell", "Trevor Foucher"],
    publisher: "オライリー・ジャパン",
  },
  "9784798172361": {
    title: "達人プログラマー",
    coverUrl: "https://placehold.co/120x180?text=Pragmatic",
    authors: ["David Thomas", "Andrew Hunt"],
    publisher: "オーム社",
  },
};

let nextId = 1;

export const handlers = [
  http.post("/api/books", async ({ request, response }) => {
    await delay(500);
    const { isbn13 } = await request.json();
    const found = CATALOGUE[isbn13];
    return response(201).json({
      id: String(nextId++),
      isbn13,
      registeredAt: new Date().toISOString(),
      title: found?.title ?? `Untitled (${isbn13})`,
      coverUrl: found?.coverUrl ?? "https://placehold.co/120x180?text=No+cover",
      authors: found?.authors ?? [],
      publisher: found?.publisher ?? "Unknown publisher",
    });
  }),
];
