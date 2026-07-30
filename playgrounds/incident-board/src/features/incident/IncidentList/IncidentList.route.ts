import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { incidentListRouteOptions } from "./IncidentList.search";
import { IncidentListContainer } from "./IncidentList.container";

export const incidentListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents",
  ...incidentListRouteOptions,
  component: IncidentListContainer,
});
