import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { Photo, PhotoPage } from "@api/Photo.api";
import { worker } from "../../../mocks/browser";
import { useGalleryContainer } from "./Gallery.container.hook";

// 25 photos with the queries layer's page size of 20 → two pages (20 + 5).
const allPhotos: Photo[] = Array.from({ length: 25 }, (_, i) => ({
  id: String(i + 1),
  title: `Photo ${i + 1}`,
  author: `Author ${i + 1}`,
  url: `https://example.test/photos/${i + 1}.jpg`,
  width: 400,
  height: 300,
}));

const pagedPhotosHandler = http.get("/api/photos", ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const start = (page - 1) * limit;
  const body: PhotoPage = {
    items: allPhotos.slice(start, start + limit),
    nextPage: start + limit < allPhotos.length ? page + 1 : null,
    total: allPhotos.length,
  };
  return HttpResponse.json(body);
});

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
});

beforeEach(() => {
  worker.use(pagedPhotosHandler);
});

afterEach(() => {
  worker.resetHandlers();
});

afterAll(() => {
  worker.stop();
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

test("loads the first page and reports more pages available", async () => {
  const { result } = await renderHook(() => useGalleryContainer(), {
    wrapper: createWrapper(),
  });

  await expect
    .poll(() => result.current.isPending, { timeout: 5000 })
    .toBe(false);
  expect(result.current.photos).toHaveLength(20);
  expect(result.current.photos[0].id).toBe("1");
  expect(result.current.hasNextPage).toBe(true);
});

test("loadMore appends the next page and reaches the end", async () => {
  const { result } = await renderHook(() => useGalleryContainer(), {
    wrapper: createWrapper(),
  });

  await expect
    .poll(() => result.current.isPending, { timeout: 5000 })
    .toBe(false);

  result.current.loadMore();

  await expect
    .poll(() => result.current.photos.length, { timeout: 5000 })
    .toBe(25);
  expect(result.current.photos[24].id).toBe("25");
  expect(result.current.hasNextPage).toBe(false);
});
