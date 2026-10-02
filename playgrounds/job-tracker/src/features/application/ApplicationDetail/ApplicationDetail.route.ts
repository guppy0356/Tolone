import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { ApplicationDetailContainer } from "./ApplicationDetail.container";
import { applicationDetailRouteOptions } from "./ApplicationDetail.search";

export const applicationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications/$applicationId",
  ...applicationDetailRouteOptions,
  component: ApplicationDetailContainer,
});
