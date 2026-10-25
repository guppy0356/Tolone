import { delay } from "msw";
import type { Memo } from "../lib/api.gen";
import { http } from "./typed-http";

const memos: Memo[] = [
  { id: "1", title: "買い物リスト", status: "draft", createdAt: "2026-10-20T09:00:00Z" },
  { id: "2", title: "読書メモ: 設計の話", status: "published", createdAt: "2026-10-21T13:30:00Z" },
  { id: "3", title: "週末の予定", status: "draft", createdAt: "2026-10-22T18:45:00Z" },
  { id: "4", title: "会議の議事録", status: "published", createdAt: "2026-10-23T10:15:00Z" },
  { id: "5", title: "アイデア置き場", status: "draft", createdAt: "2026-10-24T22:00:00Z" },
];

export const handlers = [
  http.get("/api/memos", async ({ response }) => {
    await delay(800);
    return response(200).json(memos);
  }),
];
