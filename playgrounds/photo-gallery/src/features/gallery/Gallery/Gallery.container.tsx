import { useGalleryContainer } from "./Gallery.container.hook";
import { GalleryComponent } from "./Gallery.component";

export function GalleryContainer() {
  const {
    photos,
    isPending,
    isRefetching,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useGalleryContainer();
  return (
    <GalleryComponent
      photos={photos}
      isPending={isPending}
      isRefetching={isRefetching}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      loadMore={loadMore}
    />
  );
}
