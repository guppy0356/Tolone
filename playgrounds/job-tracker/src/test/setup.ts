import { HttpNetworkFrame } from "msw/experimental";
import { afterAll, afterEach, beforeAll } from "vitest";
import { worker } from "./worker";
import "../app.css";

beforeAll(() =>
  worker.start({
    quiet: true,
    // Only the app's own calls are the test's business; the dev server's
    // module and HMR traffic is not.
    onUnhandledFrame({ frame, defaults }) {
      if (
        frame instanceof HttpNetworkFrame &&
        new URL(frame.data.request.url).pathname.startsWith("/api/")
      ) {
        // defaults.error() only prints; throwing is what fails the request.
        defaults.error();
        throw new Error(`Unhandled request: ${frame.data.request.url}`);
      }
    },
  }),
);
afterEach(() => worker.resetHandlers());
afterAll(() => worker.stop());
