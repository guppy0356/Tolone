import { createRouter } from "@tanstack/react-router";
import { rootRoute, indexRoute } from "./root.route";
import { teamListRoute } from "./features/teams/TeamList/TeamList.route";
import { teamFormRoute } from "./features/teams/TeamForm/TeamForm.route";
import { reportListRoute } from "./features/reports/ReportList/ReportList.route";
import { reportFormRoute } from "./features/reports/ReportForm/ReportForm.route";
import { reportDetailRoute } from "./features/reports/ReportDetail/ReportDetail.route";

const routeTree = rootRoute.addChildren([
  indexRoute,
  teamListRoute,
  teamFormRoute,
  reportListRoute,
  reportFormRoute,
  reportDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
