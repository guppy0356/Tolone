import { useMemo, useSyncExternalStore } from "react";
import type { Photo } from "@api/Photo.api";

export interface GalleryComponentParams {
  photos: Photo[];
}

export interface GalleryComponentState {
  columns: Photo[][];
}

// Same widths as Tailwind's md/lg breakpoints, so the skeleton's responsive
// grid and the loaded masonry agree on column count.
const COLUMN_BREAKPOINTS = [
  { query: "(min-width: 1024px)", columns: 4 },
  { query: "(min-width: 768px)", columns: 3 },
];
const DEFAULT_COLUMN_COUNT = 2;

function subscribeToBreakpoints(onChange: () => void): () => void {
  const lists = COLUMN_BREAKPOINTS.map((bp) => window.matchMedia(bp.query));
  for (const list of lists) list.addEventListener("change", onChange);
  return () => {
    for (const list of lists) list.removeEventListener("change", onChange);
  };
}

function getColumnCount(): number {
  for (const bp of COLUMN_BREAKPOINTS) {
    if (window.matchMedia(bp.query).matches) return bp.columns;
  }
  return DEFAULT_COLUMN_COUNT;
}

// Greedy shortest-column placement, tracking rendered height as height/width
// (columns render at equal width, so the aspect ratio is the rendered height
// up to a shared constant). A left fold over the list: appending a page never
// moves photos already placed, which keeps the masonry stable on load-more.
export function distributePhotos(
  photos: Photo[],
  columnCount: number,
): Photo[][] {
  const columns: Photo[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array<number>(columnCount).fill(0);
  for (const photo of photos) {
    let shortest = 0;
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[shortest]) shortest = i;
    }
    columns[shortest].push(photo);
    heights[shortest] += photo.height / photo.width;
  }
  return columns;
}

export function useGalleryComponent({
  photos,
}: GalleryComponentParams): GalleryComponentState {
  const columnCount = useSyncExternalStore(
    subscribeToBreakpoints,
    getColumnCount,
  );
  const columns = useMemo(
    () => distributePhotos(photos, columnCount),
    [photos, columnCount],
  );
  return { columns };
}
