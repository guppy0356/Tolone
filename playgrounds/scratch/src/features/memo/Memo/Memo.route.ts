import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { memoRouteOptions } from "./Memo.search";
import { MemoContainer } from "./Memo.container";

export const memoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  ...memoRouteOptions,
  component: MemoContainer,
});
