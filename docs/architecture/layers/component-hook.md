# Component Hook Layer

`{Page}.component.hook.ts`

## Responsibility

Local UI state, memoization and handlers for one page, called from inside the
[Component](./component.md). It keeps `useState` / `useMemo` / `useCallback` and
assembles the page's view model by calling the pure functions in
[`{Page}.view-model.ts`](./view-model.md).

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this page need a component hook at all? | No local state and nothing to derive → skip the file. An empty pass-through hook is ceremony | Rules ↓ |
| Does it hold `useState`? | Purely derivation + handler wrapping → no state at all is fine | Rules ↓ |
| Is the derivation needed on a branch that never calls the hook? | Yes → write it as a plain function beside the contract it derives from | ↓ Derivation outside the hook |
| How does the next URL leave the hook? | A control that navigates on change takes an `applySearch(next)` callback the Component passes in. A `<Link>` has nothing to call, so the hook returns the **value** — the search object the link points at | ↓ Deriving the next URL |

### Derivation outside the hook

Params are **guaranteed non-undefined**: the Component handles the `undefined` / loading
case before rendering the body that calls the hook. That leaves the branches that render
*without* the hook — a not-found page renders too, with no params to call it with. A
derivation that must survive those branches is not hook work: write it as a plain
function beside the contract it derives from and call it from wherever it is needed.

The rule is about *hooks* being unconditional, not about derivation being hook-only.

### Deriving the next URL

The Component owns the `<Link>` and the `navigate` call, but *what the next search should
be* is a derivation: which controls reset the page to 1, which do not, how a toggled
value folds into an array. It crosses the boundary in whichever direction the Component
needs — same derivation, two shapes. The choice is the Component's, not a second rule.

See [URL state](../url-state.md) for the contract those values are written against.

## Rules

- Receive the data and actions it needs as params, under its own
  `{Page}ComponentParams` interface
- Manage form input values, validation and UI toggles
- Derive display values from container data — merging server-returned options with
  current selections, and the like
- **The building lives in `{Page}.view-model.ts`, the memoizing lives here.** The hook
  reads `incidents.map(toIncidentListRow)` and keeps only `useMemo` / `useCallback`,
  state and handlers ([View model](./view-model.md))
- **No direct container-hook call** — receive container-hook actions as params
- **No pass-through** — return only what the hook creates (local state, derived values,
  handlers). Container data the Component or its private body needs is read straight from
  props, not re-exported here
- Export an explicit interface for the return type, `{Page}ComponentState`
  ([Type patterns](../conventions/type-patterns.md))

When the page validates a form, the hook consumes the page's zod schema through
react-hook-form's `zodResolver`; that contract and its wiring are
[Form schema](./form-schema.md).

## Example

```ts
// Todo/Todo.component.hook.ts
import { useState, useCallback } from "react";
import type { CreateTodoInput } from "@api/Todo.api";

export interface TodoComponentParams {
  addTodo: (input: CreateTodoInput) => Promise<void>;
}

export interface TodoComponentState {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useTodoComponent({
  addTodo,
}: TodoComponentParams): TodoComponentState {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return {
    newTitle,
    setNewTitle,
    handleSubmit,
  };
}
```
