import { setupWorker } from "msw/browser";

// Started with no handlers: every test registers its own responses with worker.use().
export const worker = setupWorker();
