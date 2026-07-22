import { queryOptions } from "@tanstack/react-query";
import { superiorApi } from "./Superior.api";

export const superiorQueries = {
  all: () => ["superiors"] as const,
  list: () =>
    queryOptions({
      queryKey: [...superiorQueries.all(), "list"],
      queryFn: superiorApi.getAll,
    }),
};
