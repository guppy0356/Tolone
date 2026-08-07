# Where State Lives

Every piece of state in a feature has one home, fixed by what *kind* of state it is — not
by which component renders it. This file is where that mapping is defined; the layer
files only elaborate it.

## The mapping

| State | Source of truth | Held / read / written |
|---|---|---|
| **Server data** | the server (mirrored in the TanStack Query cache) | [container hook](../layers/container-hook.md) — `useQuery` / `useMutation` over the Queries layer |
| **URL / route state** — path params, plus any filter / sort / pagination / tab meant to survive reload, be shareable, or sit in history | the URL | the [Container](../layers/container.md) **reads** it (`useParams` / `useSearch`); the [Component](../layers/component.md) **changes** it (`navigate` / `Link`). The container hook never sees the URL — it receives the parsed values as params, like a detail hook receives an `id`. Its schema is [URL state](../url-state.md) |
| **Hook-scoped query input** — an input that drives a query but is deliberately kept out of the URL (e.g. a form's typeahead keyword) | the container hook | `useState` in the container hook, exposing the value and its setter |
| **Local UI state** — form fields, toggles, drafts | the component | [component hook](../layers/component-hook.md) (a sub-component may own purely-local DOM mechanics itself) |
| **Derived / view model** | computed from the rows above | component hook, memoizing the pure functions in [`{Page}.view-model.ts`](../layers/view-model.md) |

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Where does this piece of state live? | Its **kind**, from the table above. Not which component happens to render it | ↑ The mapping |
| This query input — URL or `useState`? | **Persistence, not mechanism.** Should survive reload, be shareable, or sit in history (a list's filter/sort/page) → the URL. Ephemeral and pointless to bookmark (a form's typeahead keyword) → hook-scoped `useState` | ↓ Two rows that look alike |

### Two rows that look alike

Two rows can both present as "a query parameter", and the mechanism does not tell them
apart — both end up in a query key. Persistence does.

Either way the container hook never reads the URL itself. The Container reads it and
injects the result, and where the Component also needs the value — to render the current
controls and write them back — it arrives as an ordinary prop, never re-exported through
the hook's return.

## Why reading and changing sit in different layers

Not for one shared reason.

**Reading** is lifted to the Container so the container hook never sees the URL. It takes
parsed values as params, the way a detail hook takes an `id`, and can therefore be tested
without a router.

**Changing** stays in the Component because `<Link>` is JSX and cannot leave it.
`navigate` alone could be passed down, but then one job — changing the address — would be
split across two layers.
