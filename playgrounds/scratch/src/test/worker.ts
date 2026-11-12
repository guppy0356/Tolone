import { setupWorker } from "msw/browser";

// Started with no handlers: every test registers its own responses with
// worker.use(), so no test depends on the dev seed.
export const worker = setupWorker();
