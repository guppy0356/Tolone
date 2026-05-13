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
  useParams,
} from "@tanstack/react-router";
import { useTeamFacade } from "./features/teams/Team.facade";
import { TeamListComponent } from "./features/teams/TeamList.component";
import { TeamFormComponent } from "./features/teams/TeamForm.component";
import { useReportFacade } from "./features/reports/Report.facade";
import { useReportDetailFacade } from "./features/reports/ReportDetail.facade";
import { ReportListComponent } from "./features/reports/ReportList.component";
import { ReportFormComponent } from "./features/reports/ReportForm.component";
import { ReportDetailComponent } from "./features/reports/ReportDetail.component";
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

function ReportListContainer() {
  const facade = useReportFacade();
  return <ReportListComponent {...facade} />;
}

function ReportFormContainer() {
  const teamFacade = useTeamFacade();
  const reportFacade = useReportFacade();
  return (
    <ReportFormComponent
      teams={teamFacade.teams}
      addReport={reportFacade.addReport}
    />
  );
}

function ReportDetailContainer() {
  const { reportId } = useParams({ from: "/reports/$reportId" });
  const facade = useReportDetailFacade({ reportId });
  return <ReportDetailComponent {...facade} />;
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
