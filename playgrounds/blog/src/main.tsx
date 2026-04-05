import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { BlogListContainer } from "./features/blog/list/BlogListContainer";
import { BlogDetailContainer } from "./features/blog/detail/BlogDetailContainer";
import "./app.css";

const queryClient = new QueryClient();

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: BlogListContainer,
});

const blogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blogs/$id",
  component: BlogDetailContainer,
});

const routeTree = rootRoute.addChildren([indexRoute, blogDetailRoute]);
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
