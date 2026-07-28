import { createRouter } from "@tanstack/react-router";
import { rootRoute, indexRoute } from "./root.route";
import { incidentListRoute } from "./features/incident/IncidentList/IncidentList.route";
import { incidentDetailRoute } from "./features/incident/IncidentDetail/IncidentDetail.route";

const routeTree = rootRoute.addChildren([
  indexRoute,
  incidentListRoute,
  incidentDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
