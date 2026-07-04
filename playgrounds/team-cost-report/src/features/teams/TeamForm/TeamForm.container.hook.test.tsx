import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { worker } from "../../../mocks/browser";
import { useTeamFormContainer } from "./TeamForm.container.hook";

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

test("loads all members while the search keyword is empty", async () => {
  const { result } = await renderHook(() => useTeamFormContainer(), {
    wrapper: createWrapper(),
  });

  await expect
    .poll(() => result.current.members.length, { timeout: 5000 })
    .toBeGreaterThan(1);
  expect(result.current.memberSearch).toBe("");
});

// The hook-scoped keyword must reach the query key, so a new keyword refetches
// with the server-side filter applied — the round trip a component test with
// fixed props cannot see.
test("narrows the members to the server-filtered keyword", async () => {
  const { result } = await renderHook(() => useTeamFormContainer(), {
    wrapper: createWrapper(),
  });

  await expect
    .poll(() => result.current.members.length, { timeout: 5000 })
    .toBeGreaterThan(1);

  result.current.setMemberSearch("Ada");

  await expect
    .poll(() => result.current.members.map((m) => m.name), { timeout: 5000 })
    .toEqual(["Ada Lovelace"]);
  expect(result.current.memberSearch).toBe("Ada");
});
