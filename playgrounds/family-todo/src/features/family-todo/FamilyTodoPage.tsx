import type { FamilyTodoFacade } from "./FamilyTodo.facade";
import { FamilyTodoForm } from "./FamilyTodoForm.component";
import { FamilyTodoFilter } from "./FamilyTodoFilter.component";
import { FamilyTodoList } from "./FamilyTodoList.component";
import { FamilyTodoSkeleton } from "./FamilyTodoSkeleton";
import { MEMBER_AVATARS } from "./member-avatars";

export function FamilyTodoPage(facade: FamilyTodoFacade) {
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
  } = facade;

  return (
    <div className="mx-auto max-w-lg p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Family Todos</h1>
        <span className="text-sm text-gray-500">
          {MEMBER_AVATARS[currentUser]} {currentUser}
        </span>
      </header>

      <FamilyTodoForm addTodo={addTodo} />

      <FamilyTodoFilter
        selectedMembers={selectedMembers}
        filterTodos={filterTodos}
      />

      {isPending ? (
        <FamilyTodoSkeleton />
      ) : (
        <FamilyTodoList
          todos={todos}
          currentUser={currentUser}
          isFetching={isFetching}
          toggleTodo={toggleTodo}
          deleteTodo={deleteTodo}
        />
      )}
    </div>
  );
}
