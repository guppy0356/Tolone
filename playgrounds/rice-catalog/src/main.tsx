import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { useRiceCatalogFacade } from "./features/rice-catalog/RiceCatalog.facade";
import { RiceCatalogComponent } from "./features/rice-catalog/RiceCatalog.component";
import "./app.css";

const queryClient = new QueryClient();

function RiceCatalogPage() {
  const facade = useRiceCatalogFacade();
  return <RiceCatalogComponent {...facade} />;
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: RiceCatalogPage,
});

const routeTree = rootRoute.addChildren([indexRoute]);
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
