import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { TeamListContainer } from "./TeamList.container";

export const teamListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teams",
  component: TeamListContainer,
});
