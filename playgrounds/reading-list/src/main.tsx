import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  RouterProvider,
  redirect,
  stripSearchParams,
} from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { NavComponent } from "./features/nav/Nav.component";
import { ReadingItemListContainer } from "./features/reading-list/ReadingItemList.container";
import { ReadingItemDetailContainer } from "./features/reading-list/ReadingItemDetail.container";
import { readingItemQueries } from "./features/reading-list/ReadingItem.queries";
import {
  readingListSearchSchema,
  readingListSearchDefaults,
  type ReadingItemListQuery,
} from "./features/reading-list/ReadingItem.schema";
import "./app.css";

const queryClient = new QueryClient();

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <NavComponent />
      <main>
        <Outlet />
      </main>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/reading-list" });
  },
});

const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reading-list",
  // Filter/sort/pagination state lives in the URL search params. zodValidator
  // applies the schema (defaults + .catch) and, crucially, makes the search
  // *input* optional — so links to this route need not specify any params,
  // while the parsed output (order/page present) is what the facade reads.
  validateSearch: zodValidator(readingListSearchSchema),
  // Keep default-valued params (order=desc, page=1) out of the URL.
  search: {
    middlewares: [
      stripSearchParams<ReadingItemListQuery>(readingListSearchDefaults),
    ],
  },
  // Warm the React Query cache for the search being navigated to — including on
  // hover (defaultPreload:"intent"), so paging/filtering feels instant. Fire-
  // and-forget: the facade still owns the loading UI (skeleton/overlay), and it
  // reads the same key, so there is no double fetch.
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => {
    void queryClient.ensureQueryData(readingItemQueries.list(deps));
  },
  component: ReadingItemListContainer,
});

const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reading-list/$itemId",
  component: ReadingItemDetailContainer,
});

const routeTree = rootRoute.addChildren([indexRoute, listRoute, detailRoute]);
// preload on intent (hover/touch) runs the list loader for the target search,
// prefetching that page/filter into the query cache before the click lands.
const router = createRouter({ routeTree, defaultPreload: "intent" });

// Register the router type so search/navigate/Link are fully typed against each
// route's validated search (no casts), and the loader/stripSearchParams know
// the list route's search shape.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
