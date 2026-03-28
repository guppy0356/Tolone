import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { useFamilyTodoFacade } from "./features/family-todo/FamilyTodo.facade";
import { FamilyTodoPage } from "./features/family-todo/FamilyTodoPage";
import "./app.css";

const queryClient = new QueryClient();

function FamilyTodoContainer() {
  const {
    todos,
    isPending,
    isFetching,
    currentUser,
    selectedMembers,
    filterTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useFamilyTodoFacade();

  return (
    <FamilyTodoPage
      todos={todos}
      isPending={isPending}
      isFetching={isFetching}
      currentUser={currentUser}
      selectedMembers={selectedMembers}
      filterTodos={filterTodos}
      addTodo={addTodo}
      toggleTodo={toggleTodo}
      deleteTodo={deleteTodo}
    />
  );
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: FamilyTodoContainer,
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
