import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { IncidentDetail } from "@api/Incident.api";
import { http } from "../../../mocks/typed-http";
import { worker } from "../../../test/worker";
import {
  useIncidentDetailContainer,
  type IncidentDetailContainerParams,
} from "./IncidentDetail.container.hook";

const detail: IncidentDetail = {
  id: "1",
  key: "INC-1043",
  title: "Checkout API returning 502",
  status: "open",
  severity: "critical",
  assignee: { id: "u1", name: "Alice Chen" },
  openedAt: "2026-07-28T22:14:00Z",
  description: "Error rate above the weekly budget.",
  timeline: [
    {
      id: "e1",
      at: "2026-07-28T22:14:00Z",
      kind: "opened",
      actor: "alertmanager",
      message: "Alert fired.",
    },
  ],
};

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

test("reports a missing incident as not found rather than as an error", async () => {
  worker.use(
    http.get("/api/incidents/{incidentId}", ({ response }) =>
      response(404).empty(),
    ),
  );

  const { result } = await renderHook(
    (params: IncidentDetailContainerParams = { incidentId: "", withComments: false }) =>
      useIncidentDetailContainer(params),
    {
      wrapper: createWrapper(),
      initialProps: { incidentId: "nope", withComments: false },
    },
  );

  await vi.waitFor(() => expect(result.current.isDetailNotFound).toBe(true));
  expect(result.current.detail).toBeUndefined();
});

test("does not fetch the comments until the reader asks for them", async () => {
  let commentRequests = 0;
  worker.use(
    http.get("/api/incidents/{incidentId}", ({ response }) =>
      response(200).json(detail),
    ),
    http.get("/api/incidents/{incidentId}/comments", ({ response }) => {
      commentRequests += 1;
      return response(200).json([
        {
          id: "c1",
          author: "Bob Ito",
          body: "EU region only.",
          postedAt: "2026-07-28T22:30:00Z",
        },
      ]);
    }),
  );

  const { result, rerender } = await renderHook(
    (params: IncidentDetailContainerParams = { incidentId: "", withComments: false }) =>
      useIncidentDetailContainer(params),
    {
      wrapper: createWrapper(),
      initialProps: { incidentId: "1", withComments: false },
    },
  );

  await vi.waitFor(() => expect(result.current.detail?.key).toBe("INC-1043"));
  expect(commentRequests).toBe(0);
  // A gated query is "pending", but nothing is loading — the panel must not
  // claim otherwise.
  expect(result.current.isCommentsLoading).toBe(false);

  await rerender({ incidentId: "1", withComments: true });

  await vi.waitFor(() => expect(result.current.comments).toHaveLength(1));
  expect(commentRequests).toBe(1);
});
