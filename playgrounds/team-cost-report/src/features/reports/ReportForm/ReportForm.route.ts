import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { ReportFormContainer } from "./ReportForm.container";

export const reportFormRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports/new",
  component: ReportFormContainer,
});
