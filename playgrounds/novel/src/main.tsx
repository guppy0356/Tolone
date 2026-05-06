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
import { IndexContainer } from "./IndexContainer";
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
  component: IndexContainer,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginContainer,
});

const bookPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/preview-books/$id",
  beforeLoad: ({ params }: { params: { id: string } }) => {
    if (isAuthenticated()) {
      throw redirect({ to: "/books/$id", params: { id: params.id } });
    }
  },
  component: () => {
    const { id } = bookPreviewRoute.useParams();
    return <BookPreviewContainer key={id} />;
  },
});

const bookReaderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/books/$id",
  component: () => {
    const { id } = bookReaderRoute.useParams();
    return <BookReaderContainer key={id} />;
  },
  beforeLoad: ({ params }: { params: { id: string } }) => {
    if (!isAuthenticated()) {
      throw redirect({
        to: "/preview-books/$id",
        params: { id: params.id },
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
