import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { membersApi } from "./Members.api";

export const memberQueries = {
  all: () => ["members"] as const,
  list: (q?: string) =>
    queryOptions({
      queryKey: q
        ? [...memberQueries.all(), "list", { q }]
        : [...memberQueries.all(), "list"],
      queryFn: () => membersApi.getAll(q),
      placeholderData: keepPreviousData,
    }),
};
