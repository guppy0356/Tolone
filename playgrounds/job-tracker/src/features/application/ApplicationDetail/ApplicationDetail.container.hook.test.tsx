import { expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { worker } from "../../../test/worker";
import { createQueryWrapper } from "../../../test/query-client";
import { http } from "../../../mocks/typed-http";
import { useApplicationDetailContainer } from "./ApplicationDetail.container.hook";

const detail = {
  id: "a1",
  companyId: "c1",
  companyName: "Acme",
  position: "Frontend Engineer",
  status: "applied" as const,
  appliedAt: "2026-09-01",
  notes: "",
};

test("maps a 404 to isNotFound", async () => {
  worker.use(
    http.get("/api/applications/{applicationId}", ({ response }) => response(404).empty()),
  );
  const { result } = await renderHook(
    () => useApplicationDetailContainer({ applicationId: "missing", withInterviews: false }),
    { wrapper: createQueryWrapper() },
  );
  await vi.waitFor(() => expect(result.current.isNotFound).toBe(true));
  expect(result.current.detail).toBeUndefined();
});

test("fetches interviews only when asked for", async () => {
  const interviewsRequested = vi.fn();
  worker.use(
    http.get("/api/applications/{applicationId}", ({ response }) => response(200).json(detail)),
    http.get("/api/applications/{applicationId}/interviews", ({ response }) => {
      interviewsRequested();
      return response(200).json([
        { id: "i1", kind: "video", scheduledAt: "2026-10-14T10:00:00Z", interviewer: "Dana" },
      ]);
    }),
  );
  const wrapper = createQueryWrapper();

  const closed = await renderHook(
    () => useApplicationDetailContainer({ applicationId: "a1", withInterviews: false }),
    { wrapper },
  );
  await vi.waitFor(() => expect(closed.result.current.detail?.id).toBe("a1"));
  // Gated and never asked: not loading, not pending-forever.
  expect(closed.result.current.isInterviewsLoading).toBe(false);
  expect(interviewsRequested).not.toHaveBeenCalled();

  const open = await renderHook(
    () => useApplicationDetailContainer({ applicationId: "a1", withInterviews: true }),
    { wrapper },
  );
  await vi.waitFor(() => expect(open.result.current.interviews).toHaveLength(1));
  expect(interviewsRequested).toHaveBeenCalledTimes(1);
});
