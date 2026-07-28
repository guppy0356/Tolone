import type { ReactNode } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import {
  incidentDetailSearchConfig,
  incidentListSearchConfig,
} from "../features/incident/Incident.search";

/**
 * The "minimal router" a navigating Component needs in a story or a test: the
 * feature's real paths and search contracts, a memory history, and the
 * component under test standing in for the page. It deliberately does not
 * import the real route files — those pull in Containers, and with them a
 * QueryClient and a server, which is exactly what the Component boundary
 * exists to keep out.
 */
export function createIncidentRouter({
  children,
  initialUrl = "/incidents",
}: {
  children: ReactNode;
  initialUrl?: string;
}) {
  const rootRoute = createRootRoute();
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/incidents",
      ...incidentListSearchConfig,
      component: () => children,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/incidents/$incidentId",
      ...incidentDetailSearchConfig,
      component: () => children,
    }),
  ]);

  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });
}
