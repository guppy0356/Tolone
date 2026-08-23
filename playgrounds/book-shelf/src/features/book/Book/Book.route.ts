import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";

export const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
});
