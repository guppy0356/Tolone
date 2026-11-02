import { api } from "../lib/api-client";
import type { Memo } from "../lib/api.gen";

// The contract enters the app here and nowhere else: everything upstream
// imports these names from @api.
export type { Memo };
export type MemoStatus = Memo["status"];

export const memoApi = {
  getAll: (): Promise<Memo[]> => api.get("/api/memos"),
  delete: (id: string) => api.delete("/api/memos/{id}", { path: { id } }),
};
