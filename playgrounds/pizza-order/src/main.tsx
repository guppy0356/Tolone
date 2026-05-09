import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { usePizzaOrderFacade } from "./features/pizza-order/PizzaOrder.facade";
import { PizzaOrderComponent } from "./features/pizza-order/PizzaOrder.component";
import { useOrderHistoryFacade } from "./features/order-history/OrderHistory.facade";
import { OrderHistoryComponent } from "./features/order-history/OrderHistory.component";
import { NavComponent } from "./features/nav/Nav.component";
import "./app.css";

const queryClient = new QueryClient();

function PizzaOrderContainer() {
  const facade = usePizzaOrderFacade();
  return <PizzaOrderComponent {...facade} />;
}

function OrderHistoryContainer() {
  const facade = useOrderHistoryFacade();
  return <OrderHistoryComponent {...facade} />;
}

const rootRoute = createRootRoute({
  component: () => (
    <div className="flex min-h-screen bg-gray-50">
      <NavComponent />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: PizzaOrderContainer,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: OrderHistoryContainer,
});

const routeTree = rootRoute.addChildren([indexRoute, historyRoute]);
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
