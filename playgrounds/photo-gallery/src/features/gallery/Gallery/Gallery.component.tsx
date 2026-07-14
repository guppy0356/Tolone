import { memo, useEffect, useRef } from "react";
import { useGalleryComponent } from "./Gallery.component.hook";
import type { GalleryContainerState } from "./Gallery.container.hook";
import type { Photo } from "@api/Photo.api";

// Private memo'd body — a pure view over the distributed columns. The width
// and height attributes give each image its intrinsic aspect ratio, so the
// masonry reserves space before the image loads.
const GalleryGrid = memo(function GalleryGrid({
  columns,
}: {
  columns: Photo[][];
}) {
  return (
    <div className="flex gap-4">
      {columns.map((column, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col gap-4">
          {column.map((photo) => (
            <figure
              key={photo.id}
              className="overflow-hidden rounded-lg bg-gray-100 shadow-sm"
            >
              <img
                src={photo.url}
                alt={photo.title}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                className="block h-auto w-full"
              />
              <figcaption className="px-3 py-2">
                <p className="truncate text-sm font-medium text-gray-900">
                  {photo.title}
                </p>
                <p className="truncate text-xs text-gray-500">{photo.author}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
});

// Private sentinel — fires onLoadMore when scrolled near the viewport. The
// Component mounts it only while more pages exist and no next-page fetch is
// in flight, so remounting re-arms the observer for the following page.
function LoadMoreTrigger({ onLoadMore }: { onLoadMore: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      // Start fetching one screen early instead of at the exact bottom.
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore]);

  return <div ref={ref} className="h-px" aria-hidden="true" />;
}

// Private Skeleton — tile-granular masonry placeholder; the header stays
// rendered by the Component. Column classes match the component hook's
// breakpoints (2 / md:3 / lg:4).
const SKELETON_TILE_HEIGHTS = [
  "h-40",
  "h-64",
  "h-48",
  "h-72",
  "h-56",
  "h-44",
  "h-60",
  "h-52",
  "h-40",
  "h-64",
  "h-48",
  "h-56",
];

function GallerySkeleton() {
  return (
    <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
      {SKELETON_TILE_HEIGHTS.map((height, i) => (
        <div
          key={i}
          className={`mb-4 break-inside-avoid ${height} animate-pulse rounded-lg bg-gray-200`}
        />
      ))}
    </div>
  );
}

export function GalleryComponent({
  photos,
  isPending,
  isRefetching,
  hasNextPage,
  isFetchingNextPage,
  loadMore,
}: GalleryContainerState) {
  const { columns } = useGalleryComponent({ photos });

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
        <p className="text-sm text-gray-500">Endless photos in a masonry flow</p>
      </header>

      {isPending ? (
        <GallerySkeleton />
      ) : photos.length === 0 ? (
        <p className="text-gray-500">No photos yet.</p>
      ) : (
        <div
          className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}
        >
          <GalleryGrid columns={columns} />
          <div className="py-6 text-center text-sm text-gray-500">
            {isFetchingNextPage ? (
              <p className="animate-pulse">Loading more photos…</p>
            ) : hasNextPage ? (
              <LoadMoreTrigger onLoadMore={loadMore} />
            ) : (
              <p>You've reached the end.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
