# Setup

What `pnpm new:playground <name>` gives you, what it deliberately does not, and how types
get generated from the contract.

The scaffold writes the Vite app, one Storybook project and a starter story. Everything
below is added by hand, when the rule that needs it applies.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this playground import through `@api`? | It has a `src/api/` — so, always, from the first import onward. Add the alias in **three** files before writing that import | ↓ What the scaffold leaves for you |
| Does this enum have to exist at runtime? | A `z.enum()` or a rendered set of choices needs the members as an array → the generated zod enum's `.options` already carries them | ↓ Contract and type generation |
| A `resolve` change did not take effect | `dedupe` already set → stop editing config and clear the caches first | ↓ When a resolve change does not take |

## What the scaffold leaves for you

| | |
|---|---|
| `@api` alias | `tsconfig.json` `paths` + `vite.config.ts` and `vitest.config.ts` `resolve.alias` |
| the `unit` Vitest project | when the playground gains its first `*.test.tsx` — see [Test wiring](./testing/wiring.md) |
| `resolve.dedupe: ["react", "react-dom"]` | required as soon as `vitest-browser-react` renders anything using React context |
| `vitest-browser-react` | the dependency itself, with that first behavior test |
| `react-hook-form` + `@hookform/resolvers` | with the first form page |

## The API client

Each playground wires the [generated, validating client](./layers/api.md#the-generated-client)
in `src/lib/api-client.ts`, with ky as its transport. The generated client owns URL
building, response parsing, validation and error policy; ky owns retry and timeout
(its documented defaults). Why the seam sits exactly here:
[ADR 0012](../adr/0012-generated-client-validates-responses.md).

```ts
import ky, { HTTPError } from "ky";
import { createApiClient, type Fetcher } from "./api.gen";

// ky's status-code retry only runs while it throws, so HTTPError is caught
// *after* the retries and handed back as a response. `error.response` cannot
// be handed back as-is: ky consumed its body to populate `error.data`, so the
// error body is re-serialized into a fresh Response.
const fetcher: Fetcher = {
  fetch: async ({ url, method, urlSearchParams, parameters, requestFormat, overrides }) => {
    try {
      return await ky(url, {
        method,
        searchParams: urlSearchParams,
        ...(requestFormat === "json" && parameters?.body !== undefined
          ? { json: parameters.body }
          : {}),
        ...overrides,
      });
    } catch (error) {
      if (error instanceof HTTPError) {
        const { response } = error;
        const body =
          error.data === undefined
            ? null
            : typeof error.data === "string"
              ? error.data
              : JSON.stringify(error.data);
        return new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
      throw error;
    }
  },
};

// The client resolves paths against an absolute base URL. Input validation
// stays off: request shapes are TS-owned end to end, and zod input parsing
// would rewrite them (a defaulted contract param gets injected into the
// query string).
export const api = createApiClient(fetcher, window.location.origin, {
  validate: "output",
});

export { TypedStatusError } from "./api.gen";
```

## Contract and type generation

Each playground defines its API contract in `src/openapi.yaml`. One artifact is
generated from it — the contract module: zod schemas, per-endpoint contract objects
keyed by status code, and the validating client.

```
src/openapi.yaml ─→ typed-openapi ─→ src/lib/api.gen.ts
                     --runtime zod    ├── Todo.api.ts      (renames the types and the `.options` enum arrays)
                                      ├── Todo.queries.ts  (queryOptions over the api fns)
                                      ├── handlers.ts      (typed-http: contract-typed responses)
                                      └── api-client.ts    (ky fetcher, ↑ above)
```

```bash
pnpm --filter @tolone/todo generate:api
```

typed-openapi writes a sidecar `src/lib/api.gen.types.d.ts` next to its output; both are
generated, committed, and never edited. (`api.gen.ts` opens with `// @ts-nocheck` by
design; validation still runs.) The module exports every schema and endpoint twice under
one name — the type for annotations, the zod value for runtime — which is why an enum's
members need no second artifact: `.options` reads them off the zod enum
([URL state](./url-state.md#where-the-enum-members-come-from)).

App code imports the module's types through the [API layer](./layers/api.md) facade
only; the mock layer types its handlers from the same module through
[typed-http](./mocking.md#typed-handlers). One generator, one interpretation of the
contract ([ADR 0013](../adr/0013-single-generator-hand-rolled-mock-typing.md)).

**Type safety:** `vite-plugin-checker` runs `tsc` during dev, so mismatches between the
schema and handler/API code surface as errors in the terminal and browser overlay.

## When a `resolve` change does not take

Vite's dependency optimizer and Vitest keep the previous module graph under
`node_modules/.vite` and `node_modules/.cache`, and a stale one fails in exactly the
shapes a missing `dedupe` does — `Invalid hook call`,
`Cannot read properties of null (reading 'useContext')`, a story failing to fetch a
dynamically imported module.

Reading the table above and editing config further is the wrong move when `dedupe` is
already set:

```bash
rm -rf node_modules/.vite node_modules/.cache
```

Re-run before believing the symptom.

Machine-level setup — `pnpm install`, the Playwright Chromium download — is in
[README.md](../../README.md#setup).
