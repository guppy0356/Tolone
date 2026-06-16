import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { reportApi } from "./Report.api";

export const reportQueries = {
  all: () => ["reports"] as const,
  list: () =>
    queryOptions({
      queryKey: [...reportQueries.all(), "list"],
      queryFn: reportApi.getAll,
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...reportQueries.all(), "detail", id],
      queryFn: () => reportApi.getDetail(id),
      placeholderData: keepPreviousData,
      retry: false,
    }),
};
