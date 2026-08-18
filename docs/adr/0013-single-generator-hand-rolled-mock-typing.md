# ADR 0013: typed-openapi is the single generator; mock typing is hand-rolled over its output

- Status: Accepted
- Date: 2026-08-19

## Context

[ADR 0012](./0012-generated-client-validates-responses.md) left two generators reading
one contract: `openapi-typescript` (+ `--enum-values`) typed the app and fed
`openapi-msw`'s `paths`; `typed-openapi` supplied the zod schemas and the validating
client. Its sub-decision made the facade's annotated return types the place the two
artifacts meet, so drift between them is a `tsc` error.

That meeting point is also the bill: every contract type exists twice, the enum arrays
exist twice (`--enum-values` beside zod's `.options`), and "do the two interpretations
still agree" is a question that reopens on every bump of either generator — answered
by hand, owned by nobody. Asking whether `src/types/openapi.ts` could go (2026-08-19)
found exactly one consumer pinning it: `createOpenApiHttp<paths>()` requires
openapi-typescript's `paths` shape, and typed-openapi's `EndpointByMethod` is a
different shape. Everything else was already portable — the same-named types are
mutually assignable in both directions, and the zod enums carry the member arrays.

So the real question was never "which generator", it was **what types the mock layer**.

## Options considered

### A — keep both generators

Rejected. The duplication zone (types, enum arrays) is permanent, and the
agreement check between the two outputs has no owner and no trigger — it is re-run
when someone remembers it exists.

### B — let typed-openapi generate the handlers (`--msw`)

Rejected, on the grounds ADR 0012 already recorded for not adopting `--msw`: the
generated handlers are request-blind stubs — canned bodies behind an `as never`, the
same 200 for every request. The dev seed's behavior (filtering, paging, 404 for an
unknown id) and the tests asserting on it are the architecture under study; generating
them replaces the subject of the experiment.

### C — keep openapi-msw, adapt the type

A handwritten type-level map from `EndpointByMethod["get"]` to the `paths` shape
openapi-msw expects. Built to completion and verified (below). Rejected because of
what the adapter is pinned to: openapi-msw's *internal* type machinery — how
`QueryParams` indexes `Required<parameters>`, how `ConvertContent` detects a
no-content response — a private surface with no compatibility promise, re-derived by
reading `dist/*.d.ts`. The dependency survives and gains a shadow copy of its own
internals.

### D — hand-rolled typed helper over plain msw (chosen)

`src/mocks/typed-http.ts` (~95 lines, handwritten): `http.get(path, resolver)` where
`path` is a key of the generated `GetEndpoints`, `params` types from the endpoint's
`parameters.path`, and `response(status)` is restricted to the statuses the contract
declares — a bodyless status (typed-openapi emits `unknown`) offers only `.empty()`,
a body-bearing one only `.json(body)` typed to the contract. `.json()` also parses
the body with the endpoint's *runtime* zod schema before answering, so a mock that
drifts in a way types cannot see fails the test loudly. The resolver surface
(`{ request, params, response }`) mirrors openapi-msw's on purpose.

## Measured behavior

2026-08-19 — C and D were both built to completion in isolated checkouts against
incident-board's contract and put through the same gate:

- Both: `tsc --noEmit` clean; 6 files / 33 tests pass; **handler resolver bodies
  unchanged** — the swap is an import line.
- Compile probe (both): renaming `totalPages` in a mock body → `TS2561` at the
  handler. The contract binding survives the type-source change.
- Runtime probe (D only has the capability): a comment's `postedAt:
  "not-a-datetime"` typechecks (`string`) and fails at the handler with zod's
  `invalid_format` — a drift class the type-only binding cannot catch.
- D's gaps, accepted with eyes open: a resolver can bypass the helper by returning a
  raw `Response`; `.json()` sends the parsed body, so zod strips keys the contract
  does not declare; `unknown` doubling as the bodyless marker would misread a
  contract response body that is genuinely `unknown` (none exists).

## Sub-decisions

- **Enum arrays come from the generated zod enums' `.options`.** `--enum-values`
  retires with the generator, and with it the `.ts`-not-`.d.ts` rationale — the
  values now live in `api.gen.ts`, whose type/value split is the sidecar `.d.ts`.
- **Params types come off the generated endpoint types**
  (`get__api_todos["parameters"]["query"]`), replacing `paths[...]["query"]`.
- **The helper carries exactly the methods the playground's contract uses.** The
  first mutation endpoint adds its method to `typed-http.ts`, typing the request body
  from the endpoint's `parameters.body` the same way `params` already types.
- **The type firewall inverts, the principle does not.** The facade now imports the
  generated module's types and renames them; it remains the only place the contract
  enters app code. What ADR 0012 kept out was a *second* name for every type, and
  with one generator there is no second name.
- **`openapi-typescript` and `openapi-msw` stay in the workspace catalog** — the
  other playgrounds are snapshots of the two-generator convention and keep building.
  This convention governs new work.

## Decision

Adopt **D**. [setup.md](../architecture/setup.md) carries the single-generator
pipeline; [mocking.md](../architecture/mocking.md) carries the `typed-http` helper
and its growth rule; [url-state.md](../architecture/url-state.md) carries the
`.options` sourcing; [layers/api.md](../architecture/layers/api.md) carries the
facade's type sourcing. ADR 0012's decision — the generated validating client — is
untouched; this replaces its type-source sub-decision. Pilot playground:
incident-board.

## Why D over C

Both passed the identical gate, so the tiebreak is what each is pinned to. C is
correct only while openapi-msw's private type shapes hold, and its failure mode is a
broken adapter after a routine bump. D is pinned to msw's public handler API and to
the module this workspace generates itself. D also brought the runtime parse, which
caught a drift the type layer provably cannot.

## Revisit triggers

1. **typed-http starts growing toward a library** — typed query reading, request
   bodies across many mutation endpoints, another playground copying it wholesale:
   re-hear C, whose maintenance cost was the reason to reject it, against what the
   helper now costs.
2. **typed-openapi changes the shape of `EndpointByMethod` / the endpoint types, or
   stalls unmaintained**: the helper and the facade re-pin together;
   ADR 0012's trigger 3 already governs the client side of the same event.
3. **A contract declares a response body that is genuinely `unknown`**: the bodyless
   discriminator misreads it; the helper needs an explicit no-content marker before
   that contract ships.
4. **msw changes its handler API**: the helper is the seam; the resolvers behind it
   should not notice.
