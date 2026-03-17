import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useTodoFacade } from "./features/todo/Todo.facade";
import { useTodoPresenter } from "./features/todo/Todo.presenter";
import { TodoComponent } from "./features/todo/Todo.component";
import "./app.css";

function TodoPage() {
  const facade = useTodoFacade();
  const presenter = useTodoPresenter({ addTodo: facade.addTodo });
  return <TodoComponent {...facade} {...presenter} />;
}

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <TodoPage />
    </StrictMode>,
  );
});
