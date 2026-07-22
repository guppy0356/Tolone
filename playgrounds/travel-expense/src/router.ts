import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { travelRequestRoute } from "./features/travel-request/TravelRequest/TravelRequest.route";

const routeTree = rootRoute.addChildren([travelRequestRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
