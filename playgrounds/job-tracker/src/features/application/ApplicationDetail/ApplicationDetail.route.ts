import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { applicationDetailRouteOptions } from "./ApplicationDetail.search";

export const applicationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications/$applicationId",
  ...applicationDetailRouteOptions,
});
