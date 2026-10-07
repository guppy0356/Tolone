# ADR 0015: The scaffold writes typed-http, and its methods come from the contract

- Status: Accepted
- Date: 2026-10-08

## Context

[ADR 0013](./0013-single-generator-hand-rolled-mock-typing.md) made
`src/mocks/typed-http.ts` a handwritten helper over plain msw. One of its sub-decisions
set how the helper grows: it carries exactly the methods the playground's contract uses,
and the first mutation endpoint adds its method by hand.

That rule kept the helper out of the scaffold. typed-openapi gives `EndpointByMethod` a
key only for the methods a contract uses — `{}` for the scaffold's `paths: {}`,
`{ get: … }` for a GET-only contract — and a helper that names a method the contract
does not use fails `tsc` in its own file, whether or not a handler calls it. So
each playground wrote its helper at step 13, once the contract existed, from the prose
in [mocking.md](../architecture/mocking.md#typed-handlers). The two that have done so
wrote different files: incident-board's is 95 lines with `get` only; job-tracker's is
66 lines, a `define(method)` over four methods listed by hand, with request bodies typed.

ADR 0013's first revisit trigger names both halves of that: request bodies across
mutation endpoints, which job-tracker added, and another playground copying the helper
wholesale, which is what a scaffold that writes it does for every playground. The
trigger asks for 0013's option C to be re-heard; that is a sub-decision below.

## Options considered

### A — keep the growth rule

Rejected. Each playground rewrites the file from prose, and the two rewrites already
differ in structure. The method list is an edit the first mutation endpoint has to
remember, and so is every method after it: job-tracker's four do not include `put`.

### B — list every method, and type a missing one as `never`

`Paths<M>` resolves to `never` when the contract has no `M`, so the file compiles
against any contract and the scaffold could ship it. Rejected: `http.post` still exists
on a GET-only contract, and calling it fails at the path argument ("not assignable to
parameter of type 'never'") instead of at the method. The list is still a list — `head`
and `options` would each need the edit `put` needed.

### C — a shared workspace package

A `packages/typed-http` factory over the generated module. Rejected: the playgrounds are
snapshots — ADR 0013 kept openapi-typescript and openapi-msw in the catalog so the older
ones keep building — and a shared helper moves every snapshot whenever it changes. The
scaffold already gives each playground its own `api-client.ts`, copied from the guide;
the helper is the same kind of file.

### D — read the methods off the contract; the scaffold writes the file (chosen)

```ts
type Method = Extract<keyof EndpointByMethod, keyof typeof mswHttp>;

export const http = Object.fromEntries(
  (Object.keys(EndpointByMethod) as Method[]).map((method) => [method, define(method)]),
) as { [M in Method]: ReturnType<typeof define<M>> };
```

`http` has a property for each method the contract uses and no other. Nothing in the
file names the playground's contract, so one text serves an empty contract (`http` is
`{}`), a GET-only one and a full one, and a method the contract gains appears on the
next `generate:api`. The intersection with msw's `http` drops any method msw has no
handler for — typed-openapi can emit `trace`.

## Measured behavior

2026-10-08 — typed-openapi 4.1.0, msw 2.15.0, TypeScript 7.0.2, zod 4.6.5. Contracts
generated in a scratch directory: empty, GET-only, POST + PUT (the POST's request body
without `required: true`), and job-tracker's own.

- job-tracker's helper against the empty, GET-only and POST + PUT contracts: TS2536,
  `Type 'M' cannot be used to index type 'EndpointByMethod'`, at `Paths` and
  `EndpointOf`, and the same error at the lookup in `define`, on all three. Against the
  third, `http.put` does not exist.
- D against all four: `tsc` clean, with `@ts-expect-error` probes consumed for a method
  the contract does not use (`http.get` on the empty contract, `http.post` on the
  GET-only one, `http.put` on job-tracker's), a body of the wrong type, an undeclared
  status, `.json()` on a bodyless status, a path that belongs to another method, and a
  field the request body does not declare. The missing-method error reads
  `Property 'post' does not exist on type '{ get: … }'`.
- A request body without `required: true` is still generated as `body:`, not `body?:` —
  `request.json()` stays typed.
- D in place of job-tracker's helper, `handlers.ts` untouched: `tsc` clean, 9 files /
  33 tests pass, and so do two probe tests — `Object.keys(http)` is `delete, get, patch,
  post` at runtime, and a `patch` and a `delete` handler built from it answer through
  the test worker.
- B against the empty and GET-only contracts: `tsc` clean. `http.post("/api/todos", …)`
  on the GET-only one fails with TS2345 at the path argument, and again at the body.
- `pnpm new:playground` with the template: the written `typed-http.ts` is byte-identical
  to mocking.md's, and `tsc` is clean on the empty contract. After the contract gains a
  `post` and a `put` and is regenerated, `tsc` is clean with the helper untouched.

## Sub-decisions

- **The guide carries the source; the scaffold copies it.** mocking.md holds the whole
  file, as [setup.md](../architecture/setup.md#the-api-client) holds `api-client.ts`,
  and the scaffold's template points back at it. Writing the file at step 13 instead
  would be copying by hand — the step where the two existing versions diverged.
- **openapi-msw stays out — ADR 0013's option C, re-heard.** C's cost has not moved:
  openapi-msw's one release since 0013, 2.1.0, adds MSW v3 support, and its input is
  still openapi-typescript's `paths`, so the adapter would still be pinned to its
  private type shapes — now for request bodies as well. The helper's cost moved the
  other way: under D it is one fixed file that no contract change edits.
- **Existing playgrounds keep their helpers.** incident-board and job-tracker are
  snapshots, and each helper works against its own contract — job-tracker's four methods
  are the four its contract uses. Nothing is back-ported.

## Decision

Adopt **D**. [mocking.md](../architecture/mocking.md#typed-handlers) carries the helper,
its source and where its methods come from; [setup.md](../architecture/setup.md) lists
it among what the scaffold writes. This replaces ADR 0013's sub-decision that the first
mutation endpoint adds its method to the helper by hand. The rest of 0013 — the
hand-rolled helper over plain msw, its runtime parse, its resolver surface — stands.

## Why D over B

Both compile against any contract, so either could ship from the scaffold. The tiebreak
is the error a wrong method gives and whether the file ever needs an edit. D's error
names the method and shows the ones that exist; B's says the path is not `never`. D has
no list to extend; B needs an edit for each method it did not anticipate.

What D gives up: `http`'s type is asserted, not inferred. `Object.fromEntries` cannot
carry a type per key, so the export is a cast over the runtime object. It is right while
`Object.keys(EndpointByMethod)` and `keyof EndpointByMethod` name the same methods —
which holds because typed-openapi writes both from the contract in the same run.

## Revisit triggers

1. **A playground edits its scaffolded `typed-http.ts`.** D's premise is one text for
   every contract. A change one playground needs — typed query reading, a non-JSON
   body — goes into mocking.md and the scaffold, or A is back.
2. **typed-openapi changes which methods `EndpointByMethod` has keys for** — an empty
   map for every method, say. The derivation would quietly become B. ADR 0013's trigger 2
   covers shape changes to the module in general; this is the one D depends on.
