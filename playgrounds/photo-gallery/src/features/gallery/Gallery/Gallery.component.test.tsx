import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { Photo } from "@api/Photo.api";
import { GalleryComponent } from "./Gallery.component";

function makePhotos(count: number): Photo[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    title: `Photo ${i + 1}`,
    author: `Author ${i + 1}`,
    url: `https://example.test/photos/${i + 1}.jpg`,
    width: 400,
    height: 100,
  }));
}

test("renders every photo with title and author", async () => {
  const screen = await render(
    <GalleryComponent
      photos={makePhotos(3)}
      isPending={false}
      isRefetching={false}
      hasNextPage={false}
      isFetchingNextPage={false}
      loadMore={vi.fn()}
    />,
  );

  await expect.element(screen.getByAltText("Photo 1")).toBeInTheDocument();
  await expect.element(screen.getByAltText("Photo 3")).toBeInTheDocument();
  await expect.element(screen.getByText("Author 2")).toBeInTheDocument();
  expect(screen.container.querySelectorAll("img")).toHaveLength(3);
});

test("renders the skeleton without photos while pending", async () => {
  const screen = await render(
    <GalleryComponent
      photos={[]}
      isPending={true}
      isRefetching={false}
      hasNextPage={false}
      isFetchingNextPage={false}
      loadMore={vi.fn()}
    />,
  );

  await expect.element(screen.getByText("Photo Gallery")).toBeInTheDocument();
  expect(screen.container.querySelectorAll("img")).toHaveLength(0);
});

test("shows the empty state when there are no photos", async () => {
  const screen = await render(
    <GalleryComponent
      photos={[]}
      isPending={false}
      isRefetching={false}
      hasNextPage={false}
      isFetchingNextPage={false}
      loadMore={vi.fn()}
    />,
  );

  await expect.element(screen.getByText("No photos yet.")).toBeInTheDocument();
});

test("calls loadMore when the sentinel enters the viewport", async () => {
  const loadMore = vi.fn();
  await render(
    <GalleryComponent
      photos={makePhotos(2)}
      isPending={false}
      isRefetching={false}
      hasNextPage={true}
      isFetchingNextPage={false}
      loadMore={loadMore}
    />,
  );

  await expect
    .poll(() => loadMore.mock.calls.length, { timeout: 5000 })
    .toBeGreaterThan(0);
});

test("shows the end message and never calls loadMore when no pages remain", async () => {
  const loadMore = vi.fn();
  const screen = await render(
    <GalleryComponent
      photos={makePhotos(2)}
      isPending={false}
      isRefetching={false}
      hasNextPage={false}
      isFetchingNextPage={false}
      loadMore={loadMore}
    />,
  );

  await expect
    .element(screen.getByText("You've reached the end."))
    .toBeInTheDocument();
  expect(loadMore).not.toHaveBeenCalled();
});

test("shows the loading-more indicator instead of the sentinel while fetching", async () => {
  const loadMore = vi.fn();
  const screen = await render(
    <GalleryComponent
      photos={makePhotos(2)}
      isPending={false}
      isRefetching={false}
      hasNextPage={true}
      isFetchingNextPage={true}
      loadMore={loadMore}
    />,
  );

  await expect
    .element(screen.getByText("Loading more photos…"))
    .toBeInTheDocument();
  expect(loadMore).not.toHaveBeenCalled();
});
