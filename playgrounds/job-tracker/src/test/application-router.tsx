import type { ReactNode } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { applicationListRouteOptions } from "../features/application/ApplicationList/ApplicationList.search";
import { applicationDetailRouteOptions } from "../features/application/ApplicationDetail/ApplicationDetail.search";

interface ApplicationRouterProps {
  children: ReactNode;
  initialUrl?: string;
}

// The feature's real paths and real route options, a memory history, and the
// component under test standing in for every page. It does not import the
// route files: those pull in Containers, and with them a QueryClient and a server.
export function createApplicationRouter({
  children,
  initialUrl = "/applications",
}: ApplicationRouterProps) {
  const rootRoute = createRootRoute();
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/applications",
      ...applicationListRouteOptions, // spread, never restated
      component: () => children,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/applications/new",
      component: () => children,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/applications/$applicationId",
      ...applicationDetailRouteOptions,
      component: () => children,
    }),
  ]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });
}

export function ApplicationRouterHarness(props: ApplicationRouterProps) {
  return <RouterProvider router={createApplicationRouter(props)} />;
}
