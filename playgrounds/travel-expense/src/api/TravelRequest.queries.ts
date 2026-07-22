import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { travelRequestApi } from "./TravelRequest.api";

export const travelRequestQueries = {
  all: () => ["travel-requests"] as const,
  list: () =>
    queryOptions({
      queryKey: [...travelRequestQueries.all(), "list"],
      queryFn: travelRequestApi.getAll,
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...travelRequestQueries.all(), "detail", id],
      queryFn: () => travelRequestApi.getDetail(id),
      retry: false,
    }),
};
