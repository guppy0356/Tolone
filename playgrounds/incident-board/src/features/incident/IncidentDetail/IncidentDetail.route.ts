import { createRoute, stripSearchParams } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import {
  incidentDetailSearchDefaults,
  incidentDetailSearchSchema,
} from "../Incident.search";

export const incidentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents/$incidentId",
  validateSearch: incidentDetailSearchSchema,
  search: { middlewares: [stripSearchParams(incidentDetailSearchDefaults)] },
});
