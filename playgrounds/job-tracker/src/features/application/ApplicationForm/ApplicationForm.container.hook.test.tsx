import { expect, test, vi } from "vitest";
import { act } from "react";
import { renderHook } from "vitest-browser-react";
import { worker } from "../../../test/worker";
import { createQueryWrapper } from "../../../test/query-client";
import { http } from "../../../mocks/typed-http";
import { useApplicationFormContainer } from "./ApplicationForm.container.hook";

const companies = [
  { id: "c1", name: "Acme" },
  { id: "c2", name: "Globex" },
];

test("the keyword reaches the server and filters the companies", async () => {
  const seen: string[] = [];
  worker.use(
    http.get("/api/companies", ({ request, response }) => {
      const q = new URL(request.url).searchParams.get("q") ?? "";
      seen.push(q);
      return response(200).json(
        companies.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
      );
    }),
  );
  const { result } = await renderHook(() => useApplicationFormContainer(), {
    wrapper: createQueryWrapper(),
  });

  // No keyword, no request.
  expect(result.current.companies).toEqual([]);
  expect(result.current.isFetching).toBe(false);

  act(() => result.current.setCompanyKeyword("glo"));
  await vi.waitFor(() => expect(result.current.companies).toEqual([companies[1]]));
  expect(seen).toEqual(["glo"]);
});
