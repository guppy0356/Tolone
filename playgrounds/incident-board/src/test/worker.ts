import { setupWorker } from "msw/browser";

// Deliberately started with no handlers: `src/mocks/handlers.ts` is dev seed
// data for the browser, never a test fixture. Every test that needs a response
// registers it with `worker.use(...)` itself.
export const worker = setupWorker();
