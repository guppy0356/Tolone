import type { ReactNode } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { memoRouteOptions } from "../features/memo/Memo/Memo.search";

// The minimal router that stories and tests of the navigating Component
// share: the feature's real path, its real route options spread from the URL
// contract (never restated), a memory history, and the component under test
// standing in for the page. It deliberately does not import the real route
// file, which would pull in the Container and with it a QueryClient.
export function createMemoRouter({
  children,
  initialUrl = "/",
}: {
  children: ReactNode;
  initialUrl?: string;
}) {
  const rootRoute = createRootRoute();
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      ...memoRouteOptions,
      component: () => children,
    }),
  ]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });
}

// A story's decorator has to return an element; a test can drive the router
// from createMemoRouter directly when it asserts on the URL.
export function MemoRouterHarness(props: Parameters<typeof createMemoRouter>[0]) {
  return <RouterProvider router={createMemoRouter(props)} />;
}
