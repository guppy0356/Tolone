import { afterAll, afterEach, beforeAll } from "vitest";
import { worker } from "./worker";

beforeAll(() =>
  worker.start({
    quiet: true,
    // Only the app's own calls are the test's business; the dev server's
    // module and HMR traffic is not.
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith("/api/")) print.error();
    },
  }),
);
afterEach(() => worker.resetHandlers());
afterAll(() => worker.stop());
