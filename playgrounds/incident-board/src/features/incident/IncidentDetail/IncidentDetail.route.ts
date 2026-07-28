import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { incidentDetailSearchConfig } from "../Incident.search";

export const incidentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents/$incidentId",
  ...incidentDetailSearchConfig,
});
