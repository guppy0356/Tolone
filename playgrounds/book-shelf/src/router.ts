import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { bookRoute } from "./features/book/Book/Book.route";

const routeTree = rootRoute.addChildren([bookRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
