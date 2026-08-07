# Mocking

Every faked response in the app is typed against the same contract — `src/openapi.yaml` —
through `openapi-msw`. Two different consumers use that one technique, and they are
**separate worker instances** on purpose.

| | What it is | Where |
|---|---|---|
| dev seed | the data you see in the browser while building | `src/mocks/handlers.ts` + `src/mocks/browser.ts` |
| test worker | started with **no** handlers; each test registers its own | `src/test/worker.ts` + `src/test/setup.ts` |

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Which instance does this handler belong to? | Something you want to see in the browser during development → the dev seed. Something a test needs → that test file's `worker.use()`, never the dev seed | ↓ Why two instances |

## Typed handlers

`createOpenApiHttp<paths>()` returns a typed `http` object where response status codes and
bodies are checked against the OpenAPI schema at compile time. Both instances build their
handlers with it.

## Dev seed

```ts
// src/mocks/handlers.ts
import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type Todo = components["schemas"]["Todo"];

const http = createOpenApiHttp<paths>();

let todos: Todo[] = [
  { id: "1", title: "Learn React", completed: false },
  { id: "2", title: "Build app", completed: false },
];
let nextId = 3;

export const handlers = [
  http.get("/api/todos", async ({ response }) => {
    await delay(2000);
    return response(200).json(todos);
  }),

  http.post("/api/todos", async ({ request, response }) => {
    const body = await request.json();
    const todo: Todo = { id: String(nextId++), title: body.title, completed: false };
    todos.push(todo);
    return response(201).json(todo);
  }),

  http.patch("/api/todos/{id}", async ({ params, request, response }) => {
    const updates = await request.json();
    const index = todos.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return response(404).empty();
    }
    todos[index] = { ...todos[index], ...updates };
    return response(200).json(todos[index]);
  }),

  http.delete("/api/todos/{id}", ({ params, response }) => {
    todos = todos.filter((t) => t.id !== params.id);
    return response(204).empty();
  }),
];
```

`src/mocks/browser.ts` builds a worker from those handlers, and
[`main.tsx`](./routing.md) starts it.

## Test worker

```ts
// src/test/worker.ts — every test registers its own responses with worker.use()
export const worker = setupWorker();
```

```ts
// src/test/setup.ts
beforeAll(() =>
  worker.start({
    quiet: true,
    // Only the app's own calls are the test's business; the dev server's
    // module and HMR traffic is not.
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith("/api/")) print.error();
    },
  }),
);
afterEach(() => worker.resetHandlers());
afterAll(() => worker.stop());
```

`resetHandlers` after each test is what keeps one test's responses out of the next one.
Which tests need this at all, and the QueryClient that goes with it, is
[Hook tests](./testing/hook.md).

## Why two instances

`src/mocks/browser.ts` builds its worker **from the dev seed handlers**. A test using that
worker would depend on the seed data — on how many todos it happens to contain, on whether
one of them is completed — and would break the next time someone edits the seed to look at
something in the browser.

So the seed is not a fixture and never becomes one. Tests get an empty worker and own
every response they assert against.

The two files are wired separately as a result: `main.tsx` starts the browser worker,
`src/test/setup.ts` starts the test worker ([Test wiring](./testing/wiring.md)).
