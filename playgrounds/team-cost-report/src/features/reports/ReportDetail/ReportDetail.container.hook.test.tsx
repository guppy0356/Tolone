import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { worker } from "../../../mocks/browser";
import { useReportDetailContainer } from "./ReportDetail.container.hook";

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
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

test("loads the detail for an existing report", async () => {
  const { result } = await renderHook(
    () => useReportDetailContainer({ reportId: "r1" }),
    { wrapper: createWrapper() },
  );

  await expect
    .poll(() => result.current.isPending, { timeout: 5000 })
    .toBe(false);
  expect(result.current.isNotFound).toBe(false);
  expect(result.current.detail?.name).toBe("Q1 2026 Cost");
});

test("maps a 404 to isNotFound", async () => {
  const { result } = await renderHook(
    () => useReportDetailContainer({ reportId: "missing" }),
    { wrapper: createWrapper() },
  );

  await expect
    .poll(() => result.current.isPending, { timeout: 5000 })
    .toBe(false);
  expect(result.current.isNotFound).toBe(true);
  expect(result.current.detail).toBeUndefined();
});

test("does not map other errors to isNotFound", async () => {
  worker.use(
    http.get("/api/reports/:id", () => new HttpResponse(null, { status: 500 })),
  );

  const { result } = await renderHook(
    () => useReportDetailContainer({ reportId: "r1" }),
    { wrapper: createWrapper() },
  );

  await expect
    .poll(() => result.current.isPending, { timeout: 5000 })
    .toBe(false);
  expect(result.current.isNotFound).toBe(false);
  expect(result.current.detail).toBeUndefined();
});
