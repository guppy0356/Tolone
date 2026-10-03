import { queryOptions } from "@tanstack/react-query";
import { companyApi } from "./Company.api";

export const companyQueries = {
  all: () => ["companies"] as const,
  // Nothing writes companies, so the keyword-keyed leaf is the whole shape.
  search: (q: string) =>
    queryOptions({
      queryKey: [...companyQueries.all(), "search", q],
      queryFn: () => companyApi.search(q),
      staleTime: 60_000,
    }),
};
