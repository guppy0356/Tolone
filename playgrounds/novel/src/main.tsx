import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  RouterProvider,
} from "@tanstack/react-router";
import { LoginContainer } from "./features/login/LoginContainer";
import { BookPreviewContainer } from "./features/book-preview/BookPreviewContainer";
import { BookReaderContainer } from "./features/book-reader/BookReaderContainer";
import { isAuthenticated } from "./lib/auth-cookie";
import "./app.css";

const queryClient = new QueryClient();

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({
      to: "/books/$id",
      params: { id: "1" },
      search: { page: 1, flash: undefined },
    });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginContainer,
});

const bookPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/books/$id",
  component: BookPreviewContainer,
  validateSearch: (search: Record<string, unknown>) => {
    const rawPage = Number(search.page);
    const page =
      Number.isFinite(rawPage) && rawPage >= 1 && rawPage <= 4 ? rawPage : 1;
    return {
      page,
      flash:
        search.flash === "login-required"
          ? ("login-required" as const)
          : undefined,
    };
  },
});

const bookReaderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/books/$id/read/$page",
  component: BookReaderContainer,
  parseParams: ({ id, page }) => ({ id, page: Number(page) }),
  stringifyParams: ({ id, page }) => ({ id, page: String(page) }),
  beforeLoad: ({ params }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: "/books/$id",
        params: { id: params.id },
        search: { page: 1, flash: "login-required" },
      });
    }
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  bookPreviewRoute,
  bookReaderRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

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
