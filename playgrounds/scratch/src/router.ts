import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { memoRoute } from "./features/memo/Memo/Memo.route";

const routeTree = rootRoute.addChildren([memoRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
