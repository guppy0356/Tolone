import { createRoute, createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { Scratch } from "./features/scratch/Scratch";

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Scratch,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
