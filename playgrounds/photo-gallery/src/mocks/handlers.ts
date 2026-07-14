import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { components, paths } from "../types/openapi";

type Photo = components["schemas"]["Photo"];

const http = createOpenApiHttp<paths>();

const SUBJECTS = [
  "Harbor mist",
  "Alpine ridge",
  "Night market",
  "Desert bloom",
  "Tide pools",
  "Old town alley",
  "Autumn canopy",
  "Neon rain",
];
const AUTHORS = [
  "Aiko Tanaka",
  "Marco Rossi",
  "Lena Fischer",
  "Sam Carter",
  "Yuki Mori",
];
const HEIGHTS = [300, 500, 420, 640, 360, 560, 480, 400];

// 57 photos with a page size of 20 → pages of 20 / 20 / 17, so the last page
// is partial and the gallery visibly reaches its end.
const photos: Photo[] = Array.from({ length: 57 }, (_, i) => {
  const width = 480;
  const height = HEIGHTS[i % HEIGHTS.length];
  return {
    id: String(i + 1),
    title: `${SUBJECTS[i % SUBJECTS.length]} #${i + 1}`,
    author: AUTHORS[i % AUTHORS.length],
    url: `https://picsum.photos/seed/tolone-${i + 1}/${width}/${height}`,
    width,
    height,
  };
});

export const handlers = [
  http.get("/api/photos", async ({ query, response }) => {
    await delay(800);
    const page = Number(query.get("page") ?? 1);
    const limit = Number(query.get("limit") ?? 20);
    const start = (page - 1) * limit;
    return response(200).json({
      items: photos.slice(start, start + limit),
      nextPage: start + limit < photos.length ? page + 1 : null,
      total: photos.length,
    });
  }),
];
