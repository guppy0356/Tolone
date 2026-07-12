import {
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { NavComponent } from "./features/nav/Nav.component";

// Imports no page code: page route files import rootRoute back, so the
// reverse import would be a cycle. Chrome (Nav) never imports a route.
export const rootRoute = createRootRoute({
  component: () => (
    <div className="flex min-h-screen bg-gray-50">
      <NavComponent />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  ),
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/teams" });
  },
});
