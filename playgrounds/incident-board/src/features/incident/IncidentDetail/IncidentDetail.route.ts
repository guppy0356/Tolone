import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { incidentDetailRouteOptions } from "./IncidentDetail.search";
import { IncidentDetailContainer } from "./IncidentDetail.container";

export const incidentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents/$incidentId",
  ...incidentDetailRouteOptions,
  component: IncidentDetailContainer,
});
