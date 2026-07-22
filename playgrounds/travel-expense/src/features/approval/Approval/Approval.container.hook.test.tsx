import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createOpenApiHttp } from "openapi-msw";
import type { components, paths } from "../../../types/openapi";
import { worker } from "../../../mocks/browser";
import { useApprovalContainer } from "./Approval.container.hook";

type TravelRequest = components["schemas"]["TravelRequest"];
type TravelRequestDetail = components["schemas"]["TravelRequestDetail"];

const http = createOpenApiHttp<paths>();

const request: TravelRequest = {
  id: "tr-1",
  purpose: "Client visit in Osaka",
  startDate: "2026-07-01",
  endDate: "2026-07-02",
  totalAmount: 30000,
  status: "pending",
  approvalCount: 0,
};

const detail: TravelRequestDetail = {
  ...request,
  items: [{ id: "i-1", label: "Rail fare", amount: 30000 }],
};

beforeAll(() => worker.start({ onUnhandledRequest: "error", quiet: true }));
afterEach(() => worker.resetHandlers());
afterAll(() => worker.stop());

function renderContainerHook() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderHook(() => useApprovalContainer(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

test("selecting a request drives the detail query", async () => {
  worker.use(
    http.get("/api/travel-requests", ({ response }) =>
      response(200).json([request]),
    ),
    http.get("/api/superiors", ({ response }) => response(200).json([])),
    http.get("/api/travel-requests/{id}", ({ params, response }) =>
      params.id === "tr-1" ? response(200).json(detail) : response(404).empty(),
    ),
  );

  const { result } = await renderContainerHook();

  await vi.waitFor(() => expect(result.current.requests).toHaveLength(1));
  expect(result.current.detail).toBeUndefined();

  result.current.selectRequest("tr-1");

  await vi.waitFor(() =>
    expect(result.current.detail?.purpose).toBe("Client visit in Osaka"),
  );
  expect(result.current.selectedRequestId).toBe("tr-1");
});

test("approving updates the detail cache and refetches the list", async () => {
  let approvalCount = 0;
  let approvedBy: string | undefined;

  worker.use(
    http.get("/api/travel-requests", ({ response }) =>
      response(200).json([{ ...request, approvalCount }]),
    ),
    http.get("/api/superiors", ({ response }) => response(200).json([])),
    http.get("/api/travel-requests/{id}", ({ response }) =>
      response(200).json({ ...detail, approvalCount }),
    ),
    http.post(
      "/api/travel-requests/{id}/approve",
      async ({ request: req, response }) => {
        const body = await req.json();
        approvedBy = body.superiorId;
        approvalCount += 1;
        return response(200).json({ ...detail, approvalCount });
      },
    ),
  );

  const { result } = await renderContainerHook();

  result.current.selectRequest("tr-1");
  await vi.waitFor(() =>
    expect(result.current.detail?.approvalCount).toBe(0),
  );

  await result.current.approve("tr-1", "sup-2");

  expect(approvedBy).toBe("sup-2");
  // Mutation response written straight into the detail cache
  await vi.waitFor(() =>
    expect(result.current.detail?.approvalCount).toBe(1),
  );
  // List invalidated and refetched from the server
  await vi.waitFor(() =>
    expect(result.current.requests[0]?.approvalCount).toBe(1),
  );
});
