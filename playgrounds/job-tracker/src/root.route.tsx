import { createRootRoute, createRoute, Outlet, redirect } from "@tanstack/react-router";
import { Nav } from "./nav/Nav.component";

// Layout shell + redirects. Imports no page code: page route files import
// rootRoute back, so an import in the other direction is a cycle.
export const rootRoute = createRootRoute({
  component: () => (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl p-6">
        <Outlet />
      </main>
    </>
  ),
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/applications" });
  },
});
