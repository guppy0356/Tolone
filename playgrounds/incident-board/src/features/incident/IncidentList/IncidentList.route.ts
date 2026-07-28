import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { incidentListSearchConfig } from "../Incident.search";

export const incidentListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents",
  ...incidentListSearchConfig,
});
