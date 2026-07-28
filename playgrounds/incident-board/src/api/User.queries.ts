import { queryOptions } from "@tanstack/react-query";
import { userApi } from "./User.api";

export const userQueries = {
  all: () => ["users"] as const,

  list: () =>
    queryOptions({
      queryKey: [...userQueries.all(), "list"],
      queryFn: userApi.getAll,
    }),
};
