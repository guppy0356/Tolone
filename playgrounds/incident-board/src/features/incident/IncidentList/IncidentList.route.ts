import { createRoute, stripSearchParams } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import {
  incidentListSearchDefaults,
  incidentListSearchSchema,
} from "../Incident.search";

export const incidentListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents",
  validateSearch: incidentListSearchSchema,
  // Keeps the defaults out of the URL: a link that would render
  // ?status=[]&sort=-openedAt&page=1 renders /incidents instead.
  search: { middlewares: [stripSearchParams(incidentListSearchDefaults)] },
});
