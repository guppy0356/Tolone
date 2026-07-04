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
import { TeamListContainer } from "./features/teams/TeamList/TeamList.container";
import { TeamFormContainer } from "./features/teams/TeamForm.container";
import { ReportListContainer } from "./features/reports/ReportList/ReportList.container";
import { ReportFormContainer } from "./features/reports/ReportForm/ReportForm.container";
import { ReportDetailContainer } from "./features/reports/ReportDetail/ReportDetail.container";
import { NavComponent } from "./features/nav/Nav.component";
import "./app.css";

const queryClient = new QueryClient();

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
  beforeLoad: () => {
    throw redirect({ to: "/teams" });
  },
});

const teamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teams",
  component: TeamListContainer,
});

const teamsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teams/new",
  component: TeamFormContainer,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportListContainer,
});

const reportsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports/new",
  component: ReportFormContainer,
});

const reportDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports/$reportId",
  component: ReportDetailContainer,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  teamsRoute,
  teamsNewRoute,
  reportsRoute,
  reportsNewRoute,
  reportDetailRoute,
]);
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
