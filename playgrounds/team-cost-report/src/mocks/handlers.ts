import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type Member = components["schemas"]["Member"];

const http = createOpenApiHttp<paths>();

const members: Member[] = [
  { id: "m1", name: "Ada Lovelace" },
  { id: "m2", name: "Alan Turing" },
  { id: "m3", name: "Grace Hopper" },
  { id: "m4", name: "Linus Torvalds" },
  { id: "m5", name: "Margaret Hamilton" },
  { id: "m6", name: "Dennis Ritchie" },
  { id: "m7", name: "Barbara Liskov" },
  { id: "m8", name: "Ken Thompson" },
  { id: "m9", name: "Edsger Dijkstra" },
  { id: "m10", name: "Donald Knuth" },
  { id: "m11", name: "Anders Hejlsberg" },
  { id: "m12", name: "Brendan Eich" },
];

export const handlers = [
  http.get("/api/members", async ({ request, response }) => {
    await delay(300);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase().trim();
    const filtered = q
      ? members.filter((m) => m.name.toLowerCase().includes(q))
      : members;
    return response(200).json(filtered);
  }),
];
