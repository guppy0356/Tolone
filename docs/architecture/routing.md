# Routing

Routing is **code-based and page-owned**. Each page directory declares its own URL in
`{Page}.route.ts`: the path, the spread route options when the page keeps state in the
URL, and the Container — and nothing else. Data stays in the
[Queries layer](./layers/queries.md) and the container hooks.

Why code-based rather than the file-based default:
[ADR 0001](../adr/0001-route-definition-placement.md).

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this page keep state in the URL? | Yes → the route spreads that page's route options. No → path and Container are the whole file | [URL state](./url-state.md) |
| Is this a feature or app-shell chrome? | Navigation, the page layout and route redirects are not a feature | ↓ App-shell chrome |
| When does the route point at its Container? | Last. Declare the path first, attach `component:` after the Component compiles | ↓ The route tree types the Component |

## The three `src/`-level modules

| Module | Owns |
|---|---|
| `root.route.tsx` | the app shell — layout + redirects. **Imports no page code**: page route files import `rootRoute` back, so an import in the other direction is a cycle |
| `router.ts` | the route tree. Its `addChildren` list is the app's page-granular sitemap, and it registers the router type |
| `main.tsx` | bootstrap only — QueryClient, MSW, render |

Registering the router type is what makes `Link` / `useNavigate` / `useParams({ from })` /
`useSearch({ from })` strings type-checked against the tree.

```tsx
// root.route.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <main>
      <Outlet />
    </main>
  ),
});
```

```ts
// features/todo/Todo/Todo.route.ts
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { TodoContainer } from "./Todo.container";

export const todoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: TodoContainer,
});
```

```ts
// features/incident/IncidentList/IncidentList.route.ts — page with URL state
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { incidentListRouteOptions } from "./IncidentList.search";
import { IncidentListContainer } from "./IncidentList.container";

export const incidentListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/incidents",
  ...incidentListRouteOptions,
  component: IncidentListContainer,
});
```

```ts
// router.ts
import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { todoRoute } from "./features/todo/Todo/Todo.route";

const routeTree = rootRoute.addChildren([todoRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

const queryClient = new QueryClient();

// Inside render:
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

## The route tree types the Component

`Link`'s `to`, `useSearch({ from })` and `useParams({ from })` are checked against the
registered tree, so a Component that links anywhere does not compile until its target
routes exist in `router.ts` — and the routes cannot name a Container that has not been
written.

The cycle breaks by splitting the route work in two: **declare the URLs first** (path +
spread route options, no `component:`), **attach the Containers last**. Those are the two
halves of the [checklist](./workflow.md).

## App-shell chrome

Chrome lives **outside** the page directories. Navigation, the page layout and route
redirects are not a feature: a chrome-only component like `nav/Nav.component.tsx` has no
container, no container hook, no component hook and no stories, and the layout shell plus
redirects live in `root.route.tsx`.

`Nav` importing nothing routable is what keeps it safe to use from the root route — it
never imports a route, so no cycle forms.
