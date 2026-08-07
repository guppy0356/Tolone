# Stories

`{Page}.component.stories.tsx`

A **visual catalog**: each story renders one state through `args`, and nothing asserts.
Which components get stories at all is [What gets what](./overview.md#what-gets-what);
this file is about which *states* to catalog once one does.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Which states go in? | Pick from the menu by what the page is — list, detail, form — plus its boundary data. It is a menu, not a checklist | ↓ Catalog states |
| Does this state belong in the catalog at all? | Reachable through `args` alone → yes. Only reachable after an interaction, or living in form/hook-internal state → it has no catalog entry and goes to a [behavior test](./component.md) | ↓ Catalog states |
| Does this Component navigate? | Its stories need the shared minimal router as a decorator | [Test wiring](./wiring.md) |

## Rules

- Story `title` is `features/{Page}`
- Every state is pinned through `args`. No live data in a story
- Action props take `fn()` from `storybook/test` — for the actions panel, not for
  assertions
- No `play` function and no assertions. `@storybook/addon-vitest` runs each story as a
  render smoke test, which is all the checking a catalog does

## Catalog states

Pick the states that apply:

- **list**: has-data · empty · loading · (error, if it renders one)
- **detail**: has-data · loading · 404 / error
- **form**: default · empty/loading option sources — validation-error and submitting
  states live in react-hook-form's internals, not `args`, so they are asserted in
  behavior tests instead of storied
- **extreme / boundary data** (any type): long text, count boundaries (0 / 1 / many) —
  the visual stresses only a catalog (or later visual-regression) catches

## Template

```tsx
// Todo/Todo.component.stories.tsx — catalog only, no play
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { TodoComponent } from "./Todo.component";

const sampleTodos = [
  { id: "1", title: "Test todo", completed: false },
  { id: "2", title: "Done todo", completed: true },
];

const meta = {
  title: "features/Todo",
  component: TodoComponent,
  args: { todos: [], isPending: false, isRefetching: false, addTodo: fn() },
} satisfies Meta<typeof TodoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { todos: sampleTodos } };
export const Empty: Story = { args: { todos: [] } };
export const Loading: Story = { args: { isPending: true, todos: [] } };
export const LongText: Story = {
  args: { todos: [{ id: "1", title: "A ".repeat(120), completed: false }] },
};
```
