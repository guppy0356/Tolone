import { memo } from "react";
import { useTodoPresenter } from "./Todo.presenter";
import type { TodoFacade } from "./Todo.facade";

export const TodoComponent = memo(function TodoComponent(props: TodoFacade) {
  const {
    todos,
    toggleTodo,
    deleteTodo,
    newTitle,
    setNewTitle,
    handleSubmit,
  } = useTodoPresenter(props);

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">Todos</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="mb-4 flex gap-2"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-2 rounded border p-2"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, !todo.completed)}
              className="size-4"
            />
            <span
              className={
                todo.completed ? "flex-1 text-gray-400 line-through" : "flex-1"
              }
            >
              {todo.title}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});
