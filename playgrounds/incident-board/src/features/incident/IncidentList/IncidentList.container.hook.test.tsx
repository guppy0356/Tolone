import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { IncidentListParams, IncidentSummary } from "@api/Incident.api";
import { http } from "../../../mocks/typed-http";
import { worker } from "../../../test/worker";
import { useIncidentListContainer } from "./IncidentList.container.hook";

function incident(id: string, title: string): IncidentSummary {
  return {
    id,
    key: `INC-${id}`,
    title,
    status: "open",
    severity: "high",
    assignee: null,
    openedAt: "2026-07-01T09:00:00Z",
  };
}

function pageOf(items: IncidentSummary[]) {
  return { items, page: 1, perPage: 20, total: items.length, totalPages: 1 };
}

// One client per test, created outside the wrapper component so a rerender
// does not throw the cache away.
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

test("sends every filter to the server, repeating the multi-valued one", async () => {
  const requested: string[] = [];
  worker.use(
    http.get("/api/incidents", ({ request, response }) => {
      requested.push(new URL(request.url).search);
      return response(200).json(pageOf([incident("1", "Disk full")]));
    }),
    http.get("/api/users", ({ response }) => response(200).json([])),
  );

  const { result } = await renderHook(
    (params: IncidentListParams = {}) => useIncidentListContainer({ params }),
    {
      wrapper: createWrapper(),
      initialProps: {
        status: ["open", "resolved"],
        severity: "critical",
        assignee: "u1",
        sort: "-openedAt",
        page: 3,
      },
    },
  );

  await vi.waitFor(() => expect(result.current.incidents).toHaveLength(1));
  expect(requested).toEqual([
    "?status=open&status=resolved&severity=critical&assignee=u1&sort=-openedAt&page=3",
  ]);
});

test("keeps the previous incidents on screen while the next filter loads", async () => {
  let release: (() => void) | undefined;
  let calls = 0;
  worker.use(
    http.get("/api/incidents", async ({ response }) => {
      calls += 1;
      if (calls === 2) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      return response(200).json(
        pageOf([
          calls === 1 ? incident("1", "Disk full") : incident("2", "API latency"),
        ]),
      );
    }),
    http.get("/api/users", ({ response }) => response(200).json([])),
  );

  const { result, rerender } = await renderHook(
    (params: IncidentListParams = {}) => useIncidentListContainer({ params }),
    { wrapper: createWrapper(), initialProps: { page: 1 } },
  );

  await vi.waitFor(() =>
    expect(result.current.incidents.map((i) => i.title)).toEqual(["Disk full"]),
  );

  await rerender({ page: 2 });
  await vi.waitFor(() => expect(result.current.isIncidentsRefetching).toBe(true));

  // The point of keepPreviousData: no skeleton, no empty table, the old page
  // stays readable until the new one arrives.
  expect(result.current.isIncidentsPending).toBe(false);
  expect(result.current.incidents.map((i) => i.title)).toEqual(["Disk full"]);

  await vi.waitFor(() => expect(release).toBeDefined());
  release!();
  await vi.waitFor(() =>
    expect(result.current.incidents.map((i) => i.title)).toEqual(["API latency"]),
  );
});
