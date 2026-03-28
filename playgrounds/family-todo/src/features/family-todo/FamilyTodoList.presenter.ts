import { useCallback } from "react";
import type { FamilyMember, FamilyTodo } from "./FamilyTodo.api";

export interface FamilyTodoListProps {
  todos: FamilyTodo[];
  currentUser: FamilyMember;
  isFetching: boolean;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

export interface FamilyTodoListPresenter {
  isOwnTodo: (todo: FamilyTodo) => boolean;
}

export function useFamilyTodoListPresenter({
  currentUser,
}: Pick<FamilyTodoListProps, "currentUser">): FamilyTodoListPresenter {
  const isOwnTodo = useCallback(
    (todo: FamilyTodo) => todo.owner === currentUser,
    [currentUser],
  );

  return { isOwnTodo };
}
