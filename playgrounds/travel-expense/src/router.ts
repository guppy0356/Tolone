import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { approvalRoute } from "./features/approval/Approval/Approval.route";

const routeTree = rootRoute.addChildren([approvalRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
