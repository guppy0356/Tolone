# Component Tests

`{Name}.component.test.tsx`

Interaction and branch assertions for a page Component or a `components/`
sub-component, run by Vitest in browser mode via `vitest-browser-react`.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| What does the test render with? | Container-state props, passed directly. Never the container hook — that would drag a QueryClient and a server into the unit the Component boundary exists to keep them out of | [Anti-patterns](./overview.md#anti-patterns) |
| Does the Component navigate? | It renders `<Link>` or calls `navigate` → wrap it in the shared minimal router | [Test wiring](./wiring.md) |
| Is the text you are querying repeated on screen? | A chart legend and its axis can both say the same thing → narrow with `locator.first()` | Rules ↓ |
| Is the behavior really the Component's? | A search keyword reaching the query key is the hook's, not the Component's — test it there instead of rebuilding the wiring in a harness | [Hook tests](./hook.md) |

## Rules

- `expect` from `vitest`, `render` from `vitest-browser-react`. `render` is async — `await`
  it
- Query through the locators the render returns
- Assert on the DOM with the retrying `await expect.element(locator)`
- A `components/` sub-component gets a behavior test and no story — including one that
  cannot be storied alone, such as a chart needing a sized container

## Example

```tsx
// Todo/Todo.component.test.tsx — behavior, browser mode
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { TodoComponent } from "./Todo.component";

test("submits a new todo", async () => {
  const addTodo = vi.fn();
  const screen = await render(
    <TodoComponent todos={[]} isPending={false} isRefetching={false} addTodo={addTodo} />,
  );
  await screen.getByPlaceholder("What needs to be done?").fill("New todo");
  await screen.getByText("Add").click();
  expect(addTodo).toHaveBeenCalledWith({ title: "New todo" });
});
```
