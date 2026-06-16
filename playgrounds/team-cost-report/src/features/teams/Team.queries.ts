import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { teamApi } from "./Team.api";

export const teamQueries = {
  all: () =>
    queryOptions({
      queryKey: ["teams"],
      queryFn: teamApi.getAll,
      placeholderData: keepPreviousData,
    }),
};
