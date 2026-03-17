import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useTodoFacade } from "./features/todo/Todo.facade";
import { TodoComponent } from "./features/todo/Todo.component";
import "./app.css";

function TodoPage() {
  const facade = useTodoFacade();
  return <TodoComponent {...facade} />;
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
