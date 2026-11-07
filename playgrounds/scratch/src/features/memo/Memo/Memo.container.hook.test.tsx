import { expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { Memo } from "@api/Memo.api";
import { http } from "../../../mocks/typed-http";
import { worker } from "../../../test/worker";
import { createQueryWrapper } from "../../../test/query-client";
import { useMemoContainer } from "./Memo.container.hook";

const seed: Memo[] = [
  { id: "1", title: "買い物リスト", status: "draft", createdAt: "2026-10-20T09:00:00Z" },
  { id: "2", title: "会議の議事録", status: "published", createdAt: "2026-10-23T10:15:00Z" },
];

test("削除は即座に一覧から消え、サーバー反映後もそのまま", async () => {
  let served = [...seed];
  worker.use(
    http.get("/api/memos", ({ response }) => response(200).json(served)),
    http.delete("/api/memos/{id}", ({ params, response }) => {
      served = served.filter((m) => m.id !== params.id);
      return response(204).empty();
    }),
  );
  const { result } = await renderHook(() => useMemoContainer(), { wrapper: createQueryWrapper() });
  await vi.waitFor(() => expect(result.current.memos).toHaveLength(2));

  const done = result.current.deleteMemo("1");
  await vi.waitFor(() => expect(result.current.memos.map((m) => m.id)).toEqual(["2"]));
  await done;
  await vi.waitFor(() => expect(result.current.isRefetching).toBe(false));
  expect(result.current.memos.map((m) => m.id)).toEqual(["2"]);
});

test("削除が 404 なら一覧を元に戻す", async () => {
  worker.use(
    http.get("/api/memos", ({ response }) => response(200).json(seed)),
    http.delete("/api/memos/{id}", ({ response }) => response(404).empty()),
  );
  const { result } = await renderHook(() => useMemoContainer(), { wrapper: createQueryWrapper() });
  await vi.waitFor(() => expect(result.current.memos).toHaveLength(2));

  await expect(result.current.deleteMemo("1")).rejects.toThrow();
  await vi.waitFor(() => expect(result.current.memos).toHaveLength(2));
});
