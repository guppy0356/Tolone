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
import { useTeamFacade } from "./features/teams/Team.facade";
import { TeamListComponent } from "./features/teams/TeamList.component";
import { TeamFormComponent } from "./features/teams/TeamForm.component";
import { NavComponent } from "./features/nav/Nav.component";
import "./app.css";

const queryClient = new QueryClient();

function TeamListContainer() {
  const facade = useTeamFacade();
  return <TeamListComponent {...facade} />;
}

function TeamFormContainer() {
  const facade = useTeamFacade();
  return <TeamFormComponent {...facade} />;
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  teamsRoute,
  teamsNewRoute,
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
