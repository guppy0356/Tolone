import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { membersApi } from "./Members.api";

export const memberQueries = {
  list: (q?: string) =>
    queryOptions({
      queryKey: q ? (["members", { q }] as const) : (["members"] as const),
      queryFn: () => membersApi.getAll(q),
      placeholderData: keepPreviousData,
    }),
};
