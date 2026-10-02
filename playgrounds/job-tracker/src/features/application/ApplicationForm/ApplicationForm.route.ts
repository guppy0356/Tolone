import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { ApplicationFormContainer } from "./ApplicationForm.container";

export const applicationFormRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/applications/new",
  component: ApplicationFormContainer,
});
