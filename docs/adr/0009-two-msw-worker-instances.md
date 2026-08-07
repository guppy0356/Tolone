# ADR 0009: The dev seed worker and the test worker are separate instances

- Status: Accepted
- Date: 2026-08-07

## Context

There are two MSW workers. `src/mocks/browser.ts` builds one from
`src/mocks/handlers.ts` — the seed data you see while building, started by `main.tsx`.
`src/test/worker.ts` builds a second with **no handlers at all**, started by
`src/test/setup.ts`, and every test registers what it needs with `worker.use()`.

MSW's own documented setup is the opposite: one `handlers.ts` imported by both the browser
worker and the test one, so a test inherits the app's mocks and overrides what it cares
about. Two instances reads as duplicated wiring for no gain.

What is actually shared, and what is not:

- **The contract and the technique are shared.** Both build handlers with
  `createOpenApiHttp<paths>()`, so response status codes and bodies are checked against
  `openapi.yaml` at compile time either way.
- **Both are `setupWorker`.** Tests run in a browser
  ([ADR 0008](./0008-browser-mode-not-jsdom.md)), so there is no `setupServer` in play and
  no environment reason for two.

## Options considered

### A — two instances; the test worker starts empty (chosen)

`afterEach(worker.resetHandlers())` returns it to empty, not to a baseline.

### B — one handler set; tests start from the dev seed and override

MSW's documented shape.

Rejected: a test then depends on the seed's contents — how many todos it holds, whether
one of them is completed, what `delay` it uses. The seed exists to be *looked at*, so it
changes whenever someone wants to see something different in the browser, and every such
change is a potential failure in a test file nobody touched. Worse, a test that passes
because the seed happened to contain three items has a precondition that is invisible at
its call site.

### C — one instance, reset to a fixture baseline instead of the seed

Rejected: a shared baseline is a seed by another name. It carries the same invisible
precondition, and now there are two collections to keep aligned with the contract instead
of one.

### D — no dev seed at all; the browser starts empty too

Rejected: it removes the reason the mock layer exists at this stage. There is no backend;
`openapi.yaml` is the contract precisely so the UI can be built against it before one
exists, and something has to render in the browser meanwhile.

## Decision

Adopt **A**.
[docs/architecture/mocking.md](../architecture/mocking.md#why-two-instances) carries the
normative rule and both wirings.

## Why A over B

- **A test should state what the server returns, not inherit it.** Under B the interesting
  half is in the test and the rest is somewhere else, and which half is which depends on
  what the seed happens to hold today.
- **The seed's job is to change.** It is display data for a human with a browser open.
  Making it a fixture freezes it against its own purpose, and the first person to edit it
  for a screenshot breaks tests.
- **Sharing the right layer costs nothing.** What the two have in common — the contract and
  the typed-handler technique — is shared already. Only the instance is not, and the
  instance is the part that carries state between tests.

What A costs: every test writes its own handlers, including the dull ones, and two files
have to be wired instead of one — `main.tsx` starts the browser worker,
`src/test/setup.ts` the test worker.

## Revisit triggers

1. **Handler setup becomes the bulk of the test files.** The answer is a shared typed
   *factory* for building responses, not a shared worker — reach for that before merging
   the instances.
2. **A real backend arrives and the dev seed goes away.** The question collapses: one
   instance, by default.
3. **Node-side testing is added** — SSR, or a server-rendered test project. `setupServer`
   enters the picture and the instance count reopens as a different question.
