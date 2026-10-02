import { createRouter } from "@tanstack/react-router";
import { rootRoute, indexRoute } from "./root.route";
import { applicationListRoute } from "./features/application/ApplicationList/ApplicationList.route";
import { applicationDetailRoute } from "./features/application/ApplicationDetail/ApplicationDetail.route";
import { applicationFormRoute } from "./features/application/ApplicationForm/ApplicationForm.route";

const routeTree = rootRoute.addChildren([
  indexRoute,
  applicationListRoute,
  applicationFormRoute,
  applicationDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
