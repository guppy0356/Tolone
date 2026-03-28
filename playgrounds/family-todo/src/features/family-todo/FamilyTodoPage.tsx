import { FAMILY_MEMBERS } from "./FamilyTodo.api";
import type { FamilyMember } from "./FamilyTodo.api";
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
    setCurrentUser,
    selectedMembers,
    toggleMemberSelection,
    removeMember,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = facade;

  return (
    <div className="mx-auto max-w-lg p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Family Todos</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">User:</span>
          <select
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value as FamilyMember)}
            className="rounded border px-2 py-1 text-sm"
            aria-label="Current user"
          >
            {FAMILY_MEMBERS.map((m) => (
              <option key={m} value={m}>
                {MEMBER_AVATARS[m]} {m}
              </option>
            ))}
          </select>
        </div>
      </header>

      <FamilyTodoForm addTodo={addTodo} />

      <FamilyTodoFilter
        selectedMembers={selectedMembers}
        toggleMemberSelection={toggleMemberSelection}
        removeMember={removeMember}
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
