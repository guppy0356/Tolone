import {
  createRootRoute,
  createRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <main className="min-h-screen bg-white text-gray-900">
      <Outlet />
    </main>
  ),
});

// The app has one entry point; "/" is a doorway to it.
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/incidents" });
  },
});
