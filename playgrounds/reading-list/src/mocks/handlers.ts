import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type ReadingItem = components["schemas"]["ReadingItem"];
type ReadingItemSummary = components["schemas"]["ReadingItemSummary"];
type ReadingStatus = components["schemas"]["ReadingStatus"];
type ReadingOrder = components["schemas"]["ReadingOrder"];

const http = createOpenApiHttp<paths>();

const DEFAULT_PER_PAGE = 5;

// Seed data spread across several registration dates and statuses so the
// filter, sort, and pagination controls all have something to act on. At least
// one "read" item exists to exercise the delete-disabled rule.
let items: ReadingItem[] = [
  {
    id: "i1",
    url: "https://react.dev/learn",
    title: "Thinking in React",
    thumbnailUrl: "https://picsum.photos/seed/i1/320/180",
    status: "read",
    createdAt: "2026-06-20T09:00:00Z",
    note: "Top-down data flow; lift state up. Worth re-reading the form section.",
  },
  {
    id: "i2",
    url: "https://tanstack.com/query/latest",
    title: "TanStack Query overview",
    thumbnailUrl: "https://picsum.photos/seed/i2/320/180",
    status: "reading",
    createdAt: "2026-06-18T14:30:00Z",
    note: "Query keys, invalidation, placeholderData.",
  },
  {
    id: "i3",
    url: "https://www.typescriptlang.org/docs/handbook/2/objects.html",
    title: "TypeScript object types",
    thumbnailUrl: "https://picsum.photos/seed/i3/320/180",
    status: "unread",
    createdAt: "2026-06-15T08:00:00Z",
    note: "",
  },
  {
    id: "i4",
    url: "https://vite.dev/guide/",
    title: "Vite getting started",
    thumbnailUrl: "https://picsum.photos/seed/i4/320/180",
    status: "unread",
    createdAt: "2026-06-12T19:45:00Z",
    note: "",
  },
  {
    id: "i5",
    url: "https://mswjs.io/docs/",
    title: "Mock Service Worker docs",
    thumbnailUrl: "https://picsum.photos/seed/i5/320/180",
    status: "read",
    createdAt: "2026-06-10T11:20:00Z",
    note: "Intercepts at the network level — same handlers for dev and tests.",
  },
  {
    id: "i6",
    url: "https://tailwindcss.com/docs/utility-first",
    title: "Tailwind utility-first fundamentals",
    thumbnailUrl: "https://picsum.photos/seed/i6/320/180",
    status: "reading",
    createdAt: "2026-05-30T07:10:00Z",
    note: "Compose utilities; extract components when repetition hurts.",
  },
  {
    id: "i7",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
    title: "Using the Fetch API",
    thumbnailUrl: "https://picsum.photos/seed/i7/320/180",
    status: "unread",
    createdAt: "2026-05-22T16:00:00Z",
    note: "",
  },
  {
    id: "i8",
    url: "https://kysely.dev/docs/intro",
    title: "Kysely introduction",
    thumbnailUrl: "https://picsum.photos/seed/i8/320/180",
    status: "unread",
    createdAt: "2026-05-14T13:25:00Z",
    note: "",
  },
  {
    id: "i9",
    url: "https://storybook.js.org/docs/writing-tests",
    title: "Storybook: writing tests",
    thumbnailUrl: "https://picsum.photos/seed/i9/320/180",
    status: "read",
    createdAt: "2026-05-02T10:05:00Z",
    note: "Play functions run in the browser via the Vitest addon.",
  },
  {
    id: "i10",
    url: "https://www.patterns.dev/react/",
    title: "React patterns",
    thumbnailUrl: "https://picsum.photos/seed/i10/320/180",
    status: "reading",
    createdAt: "2026-04-19T18:40:00Z",
    note: "Container/presentational, hooks, compound components.",
  },
  {
    id: "i11",
    url: "https://web.dev/articles/vitals",
    title: "Web Vitals",
    thumbnailUrl: "https://picsum.photos/seed/i11/320/180",
    status: "unread",
    createdAt: "2026-04-03T09:30:00Z",
    note: "",
  },
  {
    id: "i12",
    url: "https://kentcdodds.com/blog/application-state-management-with-react",
    title: "Application state management with React",
    thumbnailUrl: "https://picsum.photos/seed/i12/320/180",
    status: "read",
    createdAt: "2026-03-21T12:00:00Z",
    note: "Server cache is not UI state — keep them separate.",
  },
];

// Placeholder values the server invents for a freshly registered URL — the
// client only sends the URL; the title and thumbnail are mocked here.
const PLACEHOLDER_TITLES = [
  "An article worth revisiting",
  "Notes for later",
  "A long read for the weekend",
  "Reference material to skim",
  "Something to read soon",
];
let createdCount = 0;

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    try {
      return new URL(`https://${url}`).hostname;
    } catch {
      return "unknown";
    }
  }
}

function toSummary(item: ReadingItem): ReadingItemSummary {
  return {
    id: item.id,
    url: item.url,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    status: item.status,
    createdAt: item.createdAt,
  };
}

export const handlers = [
  http.get("/api/reading-items", async ({ request, response }) => {
    await delay(400);
    const url = new URL(request.url);
    const params = url.searchParams;

    const status = params.get("status") as ReadingStatus | null;
    const createdFrom = params.get("createdFrom");
    const createdTo = params.get("createdTo");
    const order = (params.get("order") as ReadingOrder | null) ?? "desc";
    const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
    const perPage = Math.max(
      1,
      Number(params.get("perPage") ?? String(DEFAULT_PER_PAGE)) ||
        DEFAULT_PER_PAGE,
    );

    let filtered = items;
    if (status) {
      filtered = filtered.filter((item) => item.status === status);
    }
    if (createdFrom) {
      // ISO date-time slices to YYYY-MM-DD, which compares lexicographically.
      filtered = filtered.filter(
        (item) => item.createdAt.slice(0, 10) >= createdFrom,
      );
    }
    if (createdTo) {
      filtered = filtered.filter(
        (item) => item.createdAt.slice(0, 10) <= createdTo,
      );
    }

    const sorted = [...filtered].sort((a, b) =>
      order === "asc"
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );

    const total = sorted.length;
    const start = (page - 1) * perPage;
    const pageItems = sorted.slice(start, start + perPage).map(toSummary);

    return response(200).json({ items: pageItems, total, page, perPage });
  }),

  http.post("/api/reading-items", async ({ request, response }) => {
    const input = await request.json();
    const id = crypto.randomUUID();
    const title = `${
      PLACEHOLDER_TITLES[createdCount++ % PLACEHOLDER_TITLES.length]
    } — ${hostnameOf(input.url)}`;
    const item: ReadingItem = {
      id,
      url: input.url,
      title,
      thumbnailUrl: `https://picsum.photos/seed/${id}/320/180`,
      status: "unread",
      createdAt: new Date().toISOString(),
      note: "",
    };
    items = [item, ...items];
    return response(201).json(item);
  }),

  http.get("/api/reading-items/{id}", async ({ params, response }) => {
    await delay(400);
    const item = items.find((i) => i.id === params.id);
    if (!item) return response(404).empty();
    return response(200).json(item);
  }),

  http.patch(
    "/api/reading-items/{id}",
    async ({ params, request, response }) => {
      const updates = await request.json();
      const index = items.findIndex((i) => i.id === params.id);
      if (index === -1) return response(404).empty();
      const updated: ReadingItem = {
        ...items[index],
        ...(updates.note !== undefined ? { note: updates.note } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
      };
      items[index] = updated;
      return response(200).json(updated);
    },
  ),

  http.delete("/api/reading-items/{id}", ({ params, response }) => {
    const item = items.find((i) => i.id === params.id);
    if (!item) return response(404).empty();
    // A finished ("read") item is a record to keep — it cannot be deleted.
    if (item.status === "read") return response(409).empty();
    items = items.filter((i) => i.id !== params.id);
    return response(204).empty();
  }),
];
