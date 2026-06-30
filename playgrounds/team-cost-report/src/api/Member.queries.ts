import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { memberApi } from "./Member.api";

export const memberQueries = {
  all: () => ["members"] as const,
  list: (q?: string) =>
    queryOptions({
      queryKey: q
        ? [...memberQueries.all(), "list", { q }]
        : [...memberQueries.all(), "list"],
      queryFn: () => memberApi.getAll(q),
      placeholderData: keepPreviousData,
    }),
};
