import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type Pat = components["schemas"]["Pat"];

const http = createOpenApiHttp<paths>();

const pats: Pat[] = [
  {
    id: "pat_1",
    title: "Personal laptop",
    createdAt: "2026-01-12T09:00:00Z",
  },
  {
    id: "pat_2",
    title: "CI runner",
    createdAt: "2026-01-22T14:30:00Z",
  },
  {
    id: "pat_3",
    title: "Mobile dev",
    createdAt: "2026-02-03T18:15:00Z",
  },
  {
    id: "pat_4",
    title: "Read-only audit",
    createdAt: "2026-02-19T11:45:00Z",
  },
  {
    id: "pat_5",
    title: "Backup script",
    createdAt: "2026-03-08T07:22:00Z",
  },
];

export const handlers = [
  http.get("/api/pats", async ({ response }) => {
    await delay(800);
    return response(200).json(pats);
  }),

  http.post("/api/pats", async ({ response }) => {
    await delay(400);
    return response(500).json({ message: "internal error" });
  }),

  http.patch("/api/pats/{id}", async ({ response }) => {
    await delay(400);
    return response(500).json({ message: "internal error" });
  }),

  http.delete("/api/pats/{id}", async ({ response }) => {
    await delay(400);
    return response(500).json({ message: "internal error" });
  }),
];
