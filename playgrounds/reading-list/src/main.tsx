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
} from "@tanstack/react-router";
import { NavComponent } from "./features/nav/Nav.component";
import { ReadingItemListContainer } from "./features/reading-list/ReadingItemList.container";
import { ReadingItemDetailContainer } from "./features/reading-list/ReadingItemDetail.container";
import {
  readingListSearchSchema,
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
  // Filter/sort/pagination state lives in the URL search params, validated
  // (with defaults) by the zod schema. The facade reads it via useSearch.
  validateSearch: (search): ReadingItemListQuery =>
    readingListSearchSchema.parse(search),
  component: ReadingItemListContainer,
});

const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reading-list/$itemId",
  component: ReadingItemDetailContainer,
});

const routeTree = rootRoute.addChildren([indexRoute, listRoute, detailRoute]);
const router = createRouter({ routeTree });

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
