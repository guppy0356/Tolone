# Hook Tests

`{Page}.container.hook.test.tsx` / `{Page}.component.hook.test.tsx`

Exercising a hook's logic directly with `renderHook`, without rendering the page.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this hook get a test? | There is a decision in it — error mapping, a hook-scoped query param reaching the key, a derivation worth pinning. A hook that only passes `useQuery` through does not | [What gets what](./overview.md#what-gets-what) |
| Where do the responses come from? | The test file itself, through `worker.use()`, typed against the contract. Never the dev seed handlers | [Mocking](../mocking.md) |

## Rules

- A container hook *is* `useQuery`, so `renderHook` only runs inside a
  `QueryClientProvider`
- **Build the client per test**, never share one — a cache that outlives a test is a test
  depending on another's data
- Turn retries off, or the first test that asserts a 404 sits through three attempts
  before it can
- Hook-scoped behavior is tested here and not rebuilt in a Component harness. A search
  keyword reaching the query key and triggering a server-filtered refetch is the hook's
  behavior; duplicating that wiring around a Component drifts from the real hook

## Example

```tsx
// src/test/query-client.tsx
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
```

```ts
renderHook(() => useIncidentDetailContainer({ incidentId: "i1" }), {
  wrapper: createQueryWrapper(),
});
```

The worker those tests register against, and why it is a separate instance from the dev
seed one, is [Mocking](../mocking.md).
