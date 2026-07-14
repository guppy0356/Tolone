import { infiniteQueryOptions } from "@tanstack/react-query";
import { photoApi } from "./Photo.api";

const PAGE_SIZE = 20;

export const photoQueries = {
  all: () => ["photos"] as const,
  list: () =>
    infiniteQueryOptions({
      queryKey: [...photoQueries.all(), "list"],
      queryFn: ({ pageParam }) => photoApi.getPage(pageParam, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    }),
};
