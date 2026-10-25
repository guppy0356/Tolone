import { createRoute, createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { MemoContainer } from "./features/memo/Memo/Memo.container";

// ルートはまだここに直書き。5 段目で Memo.route.ts に移る。
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MemoContainer,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
