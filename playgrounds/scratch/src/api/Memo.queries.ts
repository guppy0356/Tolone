import { queryOptions } from "@tanstack/react-query";
import { memoApi } from "./Memo.api";

export const memoQueries = {
  all: () => ["memos"] as const,
  list: () =>
    queryOptions({
      queryKey: [...memoQueries.all(), "list"],
      queryFn: memoApi.getAll,
    }),
};
