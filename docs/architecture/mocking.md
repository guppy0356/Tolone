# Mocking

Every faked response in the app is typed against the same contract — `src/openapi.yaml` —
through `typed-http`, a handwritten helper typed by the generated contract module. Two
different consumers use that one technique, and they are **separate worker instances**
on purpose.

| | What it is | Where |
|---|---|---|
| dev seed | the data you see in the browser while building | `src/mocks/handlers.ts` + `src/mocks/browser.ts` |
| test worker | started with **no** handlers; each test registers its own | `src/test/worker.ts` + `src/test/setup.ts` |

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Which instance does this handler belong to? | Something you want to see in the browser during development → the dev seed. Something a test needs → that test file's `worker.use()`, never the dev seed | ↓ Why two instances |
| What version should `mockServiceWorker.js` be? | Never a choice — `pnpm install` rewrites it to the installed msw. Adding a playground means adding its path to the root list | ↓ The worker script |

## Typed handlers

`src/mocks/typed-http.ts` — handwritten, ~95 lines over plain msw — exports the typed
`http` object both instances build their handlers with. The path argument is a key of
the generated `GetEndpoints` (the contract's own literal, `{param}` style, converted to
msw's `:param` at runtime); `params` types from the endpoint's path parameters; and
`response(status)` accepts only the statuses the contract declares for that path — a
bodyless status offers `.empty()` alone, a body-bearing one `.json(body)` typed to the
contract. `.json()` also runs the endpoint's runtime zod schema over the body, so a mock
drifting in a way the types cannot see fails the test loudly.

The helper carries exactly the methods the playground's contract uses. The first
mutation endpoint adds its method to `typed-http.ts`, typing the request body from the
endpoint's `parameters.body` the same way `params` already types. Why a handwritten
helper rather than openapi-msw or generated handlers:
[ADR 0013](../adr/0013-single-generator-hand-rolled-mock-typing.md).

## Dev seed

```ts
// src/mocks/handlers.ts
import { delay } from "msw";
import type { Todo } from "../lib/api.gen";
import { http } from "./typed-http";

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
every response they assert against. Why this rather than MSW's documented single-handler
setup: [ADR 0009](../adr/0009-two-msw-worker-instances.md).

The two files are wired separately as a result: `main.tsx` starts the browser worker,
`src/test/setup.ts` starts the test worker ([Test wiring](./testing/wiring.md)).

## The worker script

Both instances register the same file, `public/mockServiceWorker.js`. It is MSW's own
script, it is committed, and it is **never edited by hand** — every byte of it comes from
the installed msw.

Keeping it current is not a step anyone performs. The root `package.json` lists every
playground's public directory in `msw.workerDirectory`, and its `postinstall` runs
`scripts/sync-msw-worker.mjs` over that list.

So a bump to msw carries the worker scripts along in the same commit, and the script says
which playgrounds it rewrote. A playground is added to the list when it is scaffolded; one
missing from it stops being updated.

Note that MSW ships an equivalent postinstall of its own, keyed off the same
`msw.workerDirectory` field — it cannot run under pnpm, and per-playground copies of the
field do nothing. Why the sync is the root project's job:
[ADR 0010](../adr/0010-worker-script-sync-at-the-root.md).
