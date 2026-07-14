import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { photoQueries } from "@api/Photo.queries";
import type { Photo } from "@api/Photo.api";

export interface GalleryContainerState {
  photos: Photo[];
  isPending: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMore: () => void;
}

export function useGalleryContainer(): GalleryContainerState {
  const {
    data,
    isPending,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(photoQueries.list());

  // Flattened once per data change so the memo'd grid sees a stable reference
  // while fetch flags toggle.
  const photos = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  // cancelRefetch: false makes repeat calls no-ops while a next-page fetch is
  // in flight, so a re-firing scroll sentinel cannot restart the request.
  const loadMore = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage]);

  return {
    photos,
    isPending,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  };
}
