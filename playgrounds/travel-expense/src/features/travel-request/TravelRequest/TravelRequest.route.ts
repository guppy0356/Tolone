import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { TravelRequestContainer } from "./TravelRequest.container";

export const travelRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: TravelRequestContainer,
});
