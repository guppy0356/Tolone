import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { ReportDetailContainer } from "./ReportDetail.container";

export const reportDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports/$reportId",
  component: ReportDetailContainer,
});
