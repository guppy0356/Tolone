# Test Wiring

What a playground needs in place before its tests can run: the two Vitest projects, and
the minimal router that stories and tests of a navigating Component share.

The MSW worker those tests register against lives with [Mocking](../mocking.md), because
it is one half of a boundary the dev seed handlers are the other half of.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this playground have a `unit` project yet? | It is added with the playground's **first** behavior test, together with `vitest-browser-react` | ↓ The two projects |
| Does this Component need a router? | It renders `<Link>` or calls `navigate` → both its stories and its tests need one | ↓ The minimal router |
| The harness needs a URL the app does not produce | The harness may choose its **paths**; it may not restate their **contract**. Spread the exported route options | ↓ The minimal router |

## The two projects

Two browser-mode Vitest projects share one Playwright provider: `storybook` (every story,
as a render smoke test) and `unit` (`src/**/*.test.{ts,tsx}` — a pure-logic test may be a
plain `.ts`).

```ts
// vitest.config.ts
// Both projects run in Playwright Chromium. Each needs its OWN config object:
// vitest stamps the resolved project name onto the shared `instances` entries,
// so reusing one literal makes the two projects collide on a single name.
// (Running one project alone hides this; `pnpm test` surfaces it.)
const browserConfig = () => ({
  enabled: true,
  provider: playwright({}),
  headless: true,
  instances: [{ browser: "chromium" }],
});

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@api": path.join(dirname, "src/api") },
    // vitest-browser-react bundles its own React; without this the router's
    // hooks run against a second copy and every render throws Invalid hook call.
    dedupe: ["react", "react-dom"],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
        test: { name: "storybook", browser: browserConfig() },
      },
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: [path.join(dirname, "src/test/setup.ts")],
          browser: browserConfig(),
        },
      },
    ],
  },
});
```

`expect.element`'s matcher types come from a
`/// <reference types="@vitest/browser/matchers" />` in `vite-env.d.ts`.

**Global setup** — CSS and providers — goes in `.storybook/preview.ts` for stories and
`src/test/setup.ts` for `.test.tsx`.

When a `resolve` change does not take, clear the caches before editing further config
([Setup](../setup.md)).

## The minimal router

A Component that renders `<Link>` or calls `navigate` needs a router in its stories and
tests. One factory in `src/test/{feature}-router.tsx` serves both: the feature's real
paths, its real route options spread from the page's
[URL contract](../url-state.md), a memory history, and the component under test standing
in for the page.

It deliberately does **not** import the real route files — those pull in Containers, and
with them a QueryClient and a server, which is what the Component boundary exists to keep
out.

```tsx
export function createIncidentRouter({ children, initialUrl = "/incidents" }) {
  const rootRoute = createRootRoute();
  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/incidents",
      ...incidentListRouteOptions, // spread, never restated
      component: () => children,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/incidents/$incidentId",
      ...incidentDetailRouteOptions,
      component: () => children,
    }),
  ]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
  });
}
```

A test can drive that router directly, but a story's decorator has to return an element.
Export the provider beside the factory so neither has to assemble it:

```tsx
export function IncidentRouterHarness(props: Parameters<typeof createIncidentRouter>[0]) {
  return <RouterProvider router={createIncidentRouter(props)} />;
}
```

**Why the options are spread and not restated.** A harness that rebuilds the schema and
omits the strip middleware exercises a URL the app can never produce —
`?status=[]&sort=-openedAt&page=1` instead of `/incidents` — and passes while asserting
something untrue.
