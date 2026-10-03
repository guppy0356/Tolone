import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { ApplicationListContainer } from "./ApplicationList.container";
import { applicationListRouteOptions } from "./ApplicationList.search";

export const applicationListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications",
  ...applicationListRouteOptions,
  component: ApplicationListContainer,
});
