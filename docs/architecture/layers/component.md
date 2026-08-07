# Component Layer

`{Page}.component.tsx`

## Responsibility

Presentational rendering, the loading UI, and delegation to the
[component hook](./component-hook.md). The file contains three parts: the exported
**Component** (loading and delegation), a **private memo'd body** (the rendered content),
and a **private Skeleton** (the loading placeholder). It renders from props alone — no
QueryClient, no server — which is what makes the Storybook catalog and props-only
behavior tests possible.

There is no separate "View" layer and no `{Page}View` symbol
([Naming](../conventions/naming.md)).

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Where is the component hook called? | Whichever component renders its output | ↓ Where the component hook is called |
| Does a loading flag have to reach the body? | Only if a page-wide refetch cannot toggle it. A flag that flips on every background refetch would break `memo` continuously | ↓ Why memo works |
| List page or not? | List → li-granular Skeleton, with the frame (heading, filters, add form) left rendered. Otherwise → page-level placeholder when the layout depends on data | Rules ↓ |
| Keep this piece private or extract it? | Small, no own state, no own props contract → private. Distinct concern with its own props and behavior → `components/{Sub}.component.tsx`. In doubt, keep it private | ↓ Sub-components |
| Does this sub-component get `memo`? | It receives reference-stable props → yes. The exported Component never does — it receives `isFetching` | ↓ Sub-components |
| Does this sub-component get a story? | It can be storied meaningfully alone → yes. One needing a sized container (a chart) is verified through its parent's story | [Storybook](../testing/storybook.md) |

### Where the component hook is called

- **Body is fully view-model-driven** → derive in the exported Component and pass the
  view model into a pure memo body (`ReportList` / `TeamList` take `rows`)
- **Body also needs raw domain** → pass the domain into the body and call the component
  hook there (`ReportDetail` passes `detail` to its private body, which calls
  `useReportDetailComponent` to derive chart data *and* reads `detail.teams`)
- **Component hook holds local state** (form inputs, toggles) → call it in the exported
  Component / form, so the state is not reset by a loading toggle or skipped by `memo`
  (`ReportForm` / `TeamForm`)

The component hook is always called **inside** the Component, never from outside, and the
Component never receives component-hook output as a prop.

## Rules

**Exported Component**

- Accepts the container-state fields it renders as individual props, typed per
  [Component props](../conventions/type-patterns.md)
- Handles `isPending` → renders the private Skeleton
- Handles `isRefetching` → wraps the rendered content in an opacity overlay.
  `isRefetching` excludes the initial load, so the Skeleton is never dimmed; the overlay
  only dims content already on screen ([Loading state](../conventions/loading-state.md))
- Calls app-shell action hooks (e.g. `useNavigate()`) and wraps them as callbacks for the
  component hook. Routing is what this boundary lets through; a server is not
- Not wrapped with `memo` — it receives `isFetching`, which changes frequently

**Private memo'd body**

- Wrapped with `memo`
- Receives only the props it needs to render — as a rule, never `isFetching` or
  `isPending`
- May call the component hook to derive from domain data, or be a pure view over a
  finished view model
- No business logic — only JSX and CSS classes

**Private Skeleton**

- No props
- For list pages: li-granular placeholder matching the body's `<li>` shape. Everything
  that does not depend on the data — heading, filter controls, an add form — stays
  rendered, and only the items become skeletons, so the frame does not flash on first
  load
- For non-list pages: page-level placeholder when the page layout depends on data that is
  not yet available

## Why memo on the private body works

`isFetching` flips on every background refetch, but only reaches the exported Component.
The private body's props (e.g. `todos`) are reference-stable thanks to TanStack Query's
structural sharing and `useCallback`, so `memo` skips the re-render.

**When a loading flag has to reach the body anyway.** The rule above exists for one
reason: a flag that flips on every background refetch would break `memo` continuously. A
flag that changes only when the body's *own* sub-view loads does not — a detail body that
owns a tab, and whose component hook is called inside it, has nowhere else to receive
`isCommentsLoading`. Pass it, and keep the purpose rather than the letter: the flag must
not be one that a page-wide refetch toggles.

## Sub-components

**Naming.** Name a sub-component for its **concern** (`ReportChart`), never a generic
structural word. The loaded body stays a *private* memo'd inner of
`{Page}.component.tsx` — do not promote it to a public `{Page}Body` just to give it a
name; a generic public name only invites blind copying.

**Placement.** Simple JSX fragments (small, no own state, no own props contract) stay
private in the same file. Larger pieces with a distinct concern (own props contract, own
behavior) become `{Page}/components/{Sub}.component.tsx`. When in doubt, keep it private;
extract when a distinct concern emerges.

**Placement is not the later split.** This is the placement decision for a piece you are
extracting anyway, while a feature is being built. It does not license the other move —
carving a working Component into sub-components *after* it is finished, each with its own
component hook — which [CLAUDE.md](../../../CLAUDE.md) puts under Future Work and
requires user approval. Extract as you write; propose, don't perform, a later split.

**Local behavior.** A sub-component may own purely-local UI mechanics — refs and effects
for DOM behavior like click-outside, as in `TeamMemberPicker` — without routing them
through a component hook. App-relevant state, such as whether the picker is open, still
lives in the component hook.

## Example

```tsx
// Todo/Todo.component.tsx
import { memo } from "react";
import { useTodoComponent } from "./Todo.component.hook";
import type { TodoContainerState } from "./Todo.container.hook";
import type { Todo } from "@api/Todo.api";

// Private memo'd body — the items, and nothing that survives loading
const TodoList = memo(function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li key={todo.id} className="rounded border p-2">
          {todo.title}
        </li>
      ))}
    </ul>
  );
});

// Private Skeleton — li-granular, standing in for the same <ul>
function TodoListSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li key={i} className="rounded border p-2">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

// Exported Component — Pick-narrowed container-state props.
// The component hook is called here, not in the body: the form does not depend
// on the todos, so it stays mounted while they load and its input keeps its value.
export function TodoComponent({
  todos,
  isPending,
  isRefetching,
  addTodo,
}: Pick<TodoContainerState, "todos" | "isPending" | "isRefetching" | "addTodo">) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoComponent({ addTodo });

  return (
    <>
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

      <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
        {isPending ? <TodoListSkeleton /> : <TodoList todos={todos} />}
      </div>
    </>
  );
}
```

