import { expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { Photo } from "@api/Photo.api";
import { distributePhotos, useGalleryComponent } from "./Gallery.component.hook";

function makePhoto(id: string, width: number, height: number): Photo {
  return {
    id,
    title: `Photo ${id}`,
    author: `Author ${id}`,
    url: `https://example.test/photos/${id}.jpg`,
    width,
    height,
  };
}

test("distributes equal-ratio photos evenly across columns", () => {
  const photos = ["1", "2", "3", "4"].map((id) => makePhoto(id, 400, 300));

  const columns = distributePhotos(photos, 2);

  expect(columns.map((column) => column.map((p) => p.id))).toEqual([
    ["1", "3"],
    ["2", "4"],
  ]);
});

test("places the next photo beside a tall photo, not under it", () => {
  const photos = [
    makePhoto("tall", 400, 800),
    makePhoto("a", 400, 400),
    makePhoto("b", 400, 400),
  ];

  const columns = distributePhotos(photos, 2);

  expect(columns.map((column) => column.map((p) => p.id))).toEqual([
    ["tall"],
    ["a", "b"],
  ]);
});

test("appending photos never moves photos already placed", () => {
  const heights = [300, 500, 420, 640, 360, 560, 480, 400];
  const photos = heights.map((height, i) =>
    makePhoto(String(i + 1), 400, height),
  );

  const before = distributePhotos(photos.slice(0, 5), 3);
  const after = distributePhotos(photos, 3);

  for (let i = 0; i < 3; i++) {
    const beforeIds = before[i].map((p) => p.id);
    expect(after[i].map((p) => p.id).slice(0, beforeIds.length)).toEqual(
      beforeIds,
    );
  }
});

test("useGalleryComponent keeps every photo exactly once across columns", async () => {
  const photos = Array.from({ length: 7 }, (_, i) =>
    makePhoto(String(i + 1), 400, 300 + i * 50),
  );

  const { result } = await renderHook(() => useGalleryComponent({ photos }));

  const ids = result.current.columns.flat().map((p) => p.id);
  expect([...ids].sort()).toEqual(photos.map((p) => p.id).sort());
});
