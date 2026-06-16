import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { teamApi } from "./Team.api";

export const teamQueries = {
  list: () =>
    queryOptions({
      queryKey: ["teams"],
      queryFn: teamApi.getAll,
      placeholderData: keepPreviousData,
    }),
};
