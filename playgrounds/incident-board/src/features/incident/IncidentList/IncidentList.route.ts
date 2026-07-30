import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { incidentListSearchConfig } from "./IncidentList.search";
import { IncidentListContainer } from "./IncidentList.container";

export const incidentListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents",
  ...incidentListSearchConfig,
  component: IncidentListContainer,
});
