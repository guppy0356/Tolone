# Setup

What `pnpm new:playground <name>` gives you, what it deliberately does not, and how types
get generated from the contract.

The scaffold writes the Vite app, one Storybook project and a starter story. Everything
below is added by hand, when the rule that needs it applies.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this playground import through `@api`? | It has a `src/api/` — so, always, from the first import onward. Add the alias in **three** files before writing that import | ↓ What the scaffold leaves for you |
| Does this enum have to exist at runtime? | A `z.enum()` or a rendered set of choices needs the members as an array → `--enum-values`, and the output is a `.ts` | ↓ Contract and type generation |
| A `resolve` change did not take effect | `dedupe` already set → stop editing config and clear the caches first | ↓ When a resolve change does not take |

## What the scaffold leaves for you

| | |
|---|---|
| `@api` alias | `tsconfig.json` `paths` + `vite.config.ts` and `vitest.config.ts` `resolve.alias` |
| the `unit` Vitest project | when the playground gains its first `*.test.tsx` — see [Test wiring](./testing/wiring.md) |
| `resolve.dedupe: ["react", "react-dom"]` | required as soon as `vitest-browser-react` renders anything using React context |
| `vitest-browser-react` | the dependency itself, with that first behavior test |
| `zod` | as soon as a page validates a [form](./layers/form-schema.md) or keeps state in the [URL](./url-state.md) |
| `react-hook-form` + `@hookform/resolvers` | with the first form page |

## The ky client

Each playground has a shared ky instance in `src/lib/api-client.ts`:

```ts
import ky from "ky";
export const api = ky.create({ prefix: "/api" });
```

How the [API layer](./layers/api.md) calls it is that layer's business.

## Contract and type generation

Each playground defines its API contract in `src/openapi.yaml`. Types are generated from
it and used by both the API layer and the mock handlers.

```
src/openapi.yaml → openapi-typescript → src/types/openapi.ts
                    --enum-values       ├── Todo.api.ts      (renames the types and the enum arrays)
                                        ├── Todo.queries.ts  (queryOptions over the api fns)
                                        └── handlers.ts      (openapi-msw: type-safe responses)
```

```bash
pnpm --filter @tolone/todo generate:api
```

`--enum-values` makes the generated module carry each enum's members as an array as well
as its type — what a `z.enum()` or a rendered set of choices needs at runtime — which is
why the output is a `.ts` and not a `.d.ts`. A `.d.ts` would declare the arrays and
produce none of them, so every call site would compile and the page would find nothing
there. The API layer renames both halves; see [URL state](./url-state.md).

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
