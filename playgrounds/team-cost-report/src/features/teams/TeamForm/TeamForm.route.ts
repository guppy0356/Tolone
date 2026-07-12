import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { TeamFormContainer } from "./TeamForm.container";

export const teamFormRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teams/new",
  component: TeamFormContainer,
});
