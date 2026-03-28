import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { useFamilyTodoFacade } from "./features/family-todo/FamilyTodo.facade";
import { FamilyTodoComponent } from "./features/family-todo/FamilyTodo.component";
import type { FamilyMember } from "./features/family-todo/FamilyTodo.api";
import "./app.css";

const queryClient = new QueryClient();

function FamilyTodoPage() {
  const [currentUser, setCurrentUser] = useState<FamilyMember>("Papa");
  const facade = useFamilyTodoFacade(currentUser, setCurrentUser);
  return <FamilyTodoComponent {...facade} />;
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FamilyTodoPage,
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
