import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { reportApi } from "./Report.api";

export const reportQueries = {
  all: () =>
    queryOptions({
      queryKey: ["reports"],
      queryFn: reportApi.getAll,
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ["reports", id],
      queryFn: () => reportApi.getDetail(id),
      placeholderData: keepPreviousData,
      retry: false,
    }),
};
