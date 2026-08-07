# Adding a Feature

The order to build in, and the file to read at each step. Read
[the overview](./overview.md) first if you have not.

**Commit after each step.** Do not batch multiple steps into one commit. Every commit must
pass the touched playground's typecheck (`pnpm --filter <pkg> exec tsc --noEmit -p .`) —
enforced by the Lefthook pre-commit hook.

## Why routes come early

`Link`, `useSearch({ from })` and `useParams({ from })` are typed against the registered
route tree, so a Component that navigates cannot typecheck before its routes exist — while
the routes cannot name a Container that has not been written.

The cycle breaks by splitting the route work: **declare the URLs first** (path + spread
route options, no `component:`), **attach the Containers last**. Steps 6 and 15 are the
two halves ([Routing](./routing.md)).

## The steps

1. Define endpoints and schemas in `src/openapi.yaml` → **commit**
   — [Setup](./setup.md)
2. Run `pnpm generate:api` to generate types → **commit**
   — [Setup](./setup.md)
3. `src/api/{Resource}.api.ts` — generated types + the API function object; rename anything
   that collides with a DOM global → **commit**
   — [API layer](./layers/api.md)
4. `src/api/{Resource}.queries.ts` — the `queryOptions()` factory (`all` / `list` /
   `detail`) over the API functions → **commit**
   — [Queries layer](./layers/queries.md)
5. Create `src/features/{feature-name}/{Page}/`
   — [Directory structure](./conventions/directory-structure.md),
   [Naming](./conventions/naming.md)
6. **Routes before Components.** When any page keeps state in the URL, write its URL
   contract. Then declare every route of the feature: `{Page}.route.ts` with path + spread
   route options and **no `component:`**, registered in `router.ts`'s `addChildren` →
   **commit**
   — [URL state](./url-state.md), [Routing](./routing.md)
7. `{Page}.container.hook.ts` — `use{Page}Container` + `{Page}ContainerState`. Pick the
   mutation side-effect pattern. When the hook holds logic worth testing in isolation
   (error mapping, hook-scoped query params), add its test in the same commit → **commit**
   — [Container hook](./layers/container-hook.md),
   [Loading state](./conventions/loading-state.md), [Hook tests](./testing/hook.md)
8. `{Page}.schema.ts` — zod form contract + `z.infer` type, output pinned to the API input
   via `satisfies` (**only when the page validates a form**) → **commit**
   — [Form schema](./layers/form-schema.md)
9. `{Page}.view-model.ts` — the shapes the Component receives + one pure function per
   record; constants for option lists that depend on nothing → **commit**
   — [View model](./layers/view-model.md)
10. `{Page}.component.hook.ts` — `use{Page}Component` + `{Page}ComponentState`, memoizing
    the view model's functions and wrapping handlers (**skip this file entirely** when the
    Component has no local state and nothing to derive) → **commit**
    — [Component hook](./layers/component-hook.md)
11. `{Page}.component.tsx` — the exported Component + private memo'd body + private
    Skeleton
    — [Component](./layers/component.md), [Type patterns](./conventions/type-patterns.md)
12. `{Page}.component.stories.tsx` — catalog states through `args`, no `play` — and
    `{Page}.component.test.tsx` — behavior assertions. Navigating Components use the shared
    minimal router. Run `pnpm test` to verify → **commit** (Component + stories + tests
    together)
    — [Stories](./testing/storybook.md), [Component tests](./testing/component.md),
    [Test wiring](./testing/wiring.md)
13. Add typed mock handlers to `src/mocks/handlers.ts` → **commit**
    — [Mocking](./mocking.md)
14. `{Page}.container.tsx` — reads app-shell inputs, calls the container hook, passes
    fields to the Component → **commit**
    — [Container](./layers/container.md)
15. Point each route at its Container: add `component: {Page}Container` to the
    `{Page}.route.ts` written in step 6 → **commit**
    — [Routing](./routing.md)
