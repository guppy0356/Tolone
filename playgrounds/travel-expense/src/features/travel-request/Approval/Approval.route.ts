import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { ApprovalContainer } from "./Approval.container";

export const approvalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ApprovalContainer,
});
