import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { ReportListContainer } from "./ReportList.container";

export const reportListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportListContainer,
});
