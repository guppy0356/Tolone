import { api } from "../lib/api-client";
import { Memo } from "../lib/api.gen";

// The contract enters the app here and nowhere else: everything upstream
// imports these names from @api.
export type { Memo };
export type MemoStatus = Memo["status"];
// The members as a runtime array, read off the generated zod enum rather than
// typed out a second time.
export const MEMO_STATUSES: readonly MemoStatus[] = Memo.shape.status.options;

export const memoApi = {
  getAll: (): Promise<Memo[]> => api.get("/api/memos"),
  delete: (id: string) => api.delete("/api/memos/{id}", { path: { id } }),
};
