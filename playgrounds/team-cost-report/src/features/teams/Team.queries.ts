import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { teamApi } from "./Team.api";

export const teamQueries = {
  all: () => ["teams"] as const,
  list: () =>
    queryOptions({
      queryKey: [...teamQueries.all(), "list"],
      queryFn: teamApi.getAll,
      placeholderData: keepPreviousData,
    }),
};
