import { memo } from "react";
import {
  useFamilyTodoListPresenter,
  type FamilyTodoListProps,
} from "./FamilyTodoList.presenter";
import { MEMBER_AVATARS } from "./member-avatars";

export const FamilyTodoList = memo(function FamilyTodoList(
  props: FamilyTodoListProps,
) {
  const { todos, isFetching, toggleTodo, deleteTodo } = props;
  const { isOwnTodo } = useFamilyTodoListPresenter(props);

  return (
    <ul
      className={`space-y-2 transition-opacity ${isFetching ? "opacity-50" : ""}`}
    >
      {todos.map((todo) => {
        const own = isOwnTodo(todo);
        return (
          <li
            key={todo.id}
            className="flex items-center gap-2 rounded border p-2"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, !todo.completed)}
              disabled={!own}
              className="size-4"
              aria-label={`Toggle ${todo.title}`}
            />
            <span className="text-lg">{MEMBER_AVATARS[todo.owner]}</span>
            <span
              className={
                todo.completed
                  ? "flex-1 text-gray-400 line-through"
                  : "flex-1"
              }
            >
              {todo.title}
            </span>
            <span className="text-xs text-gray-400">{todo.owner}</span>
            {own && (
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700"
                aria-label={`Delete ${todo.title}`}
              >
                Delete
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
});
