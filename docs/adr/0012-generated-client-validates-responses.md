# ADR 0012: Responses are validated at the fetch boundary by a client generated from the contract

- Status: Accepted
- Date: 2026-08-16

## Context

`.json<T>()` was a compile-time assertion: the API layer named a response type and
nothing ever checked the bytes against it. The playground world never noticed, because
both sides of every request derive from the same `src/openapi.yaml` — `openapi-typescript`
types the app, `openapi-msw` types the handlers — so drift between them is a `tsc` error.
The gap opens at a **real server**, whose deploys are not synchronized with the contract
file: a field renamed on the server still returns 200, the cast still resolves, and
`undefined` surfaces as a rendering bug far from its cause. Deciding to design for that
boundary (2026-08-16) is what forced the question.

The constraint that shaped every option: `src/openapi.yaml` stays the single source.
Any scheme that describes the same shapes again by hand — a zod schema per response,
maintained beside the generated types — is double bookkeeping of the contract, and was
ruled out before the comparison started.

## Options considered

### A — keep trusting the cast until a real server exists

Rejected. Validation is inert against contract-typed mocks, so nothing breaks today —
but the seam being designed (who validates, what error type crosses layers, where retry
lives) is exactly what this workspace exists to pin down, and retrofitting it later
re-argues the same questions with more code in the way.

### B — replace ky with up-fetch (per-request `schema` option)

Rejected. Its headline gains are matched by ky 2, which already validates via
`.json(standardSchema)`; its documented retry has no stated defaults where ky documents
`limit: 2` with named methods and status codes; and the binding from endpoint to schema
stays hand-maintained at every call site.

### C — keep ky, pass generated schemas to `.json(schema)` per call

Generators exist that emit standalone zod schemas from OpenAPI (orval, kubb). Rejected
because the endpoint→schema **binding** remains a convention enforced at ~46 call sites:
nothing forces a call site to pass the right schema — or any schema — and the misses are
precisely the drift cases the validation was bought to catch.

### D — generate the client itself from the contract (chosen)

`typed-openapi --runtime zod` emits one module per playground: per-component zod schemas,
per-endpoint contract objects keyed by status code, and an `ApiClient` that parses and
validates every success response before it reaches the caller. The binding is a generated
artifact, not a convention; the only rule left to enforce is "call through the facade",
which the layer rules already state.

openapi-zod-client was disqualified before this comparison: it generates an axios-bound
Zodios client, supports zod 3 only, and has had no release since 2025-02.

## Measured behavior

Spike, 2026-08-16 — typed-openapi 3.2.1, ky 2.0.2, zod 4.4.3, against
incident-board's contract:

- The query encoder reproduces the previous hand-built `URLSearchParams` wire format
  byte for byte (`status=open&status=resolved&severity=critical&assignee=u1&sort=-openedAt&page=3`).
- `validate: "both"` **rewrites requests**: input parsing applies contract defaults, so a
  `default: 1` page parameter is injected into every list query string. Request shapes
  are already TS-owned end to end (params types pinned by `satisfies`), so input
  validation buys nothing and changes the wire — validation runs `"output"` only.
- ky's status-code retry sits inside its `throwHttpErrors` branch (ky 2.0.2 source), so
  a fetcher passing `throwHttpErrors: false` silently loses it. The fetcher keeps
  throwing enabled and catches `HTTPError` after ky's retries; ky has already read the
  error body (without cloning) into `error.data`, so the fetcher hands back a response
  that serves that.
- A 404 with an empty body parses to `undefined` and throws `TypedStatusError`; a
  response missing a contract field throws zod's error at the boundary; fields the
  contract does not know are silently stripped.

## Sub-decisions

- **ky stays, demoted to transport.** It is the generated client's fetcher — retry and
  timeout keep their documented ky behavior — and stops being the client that call
  sites see.
- **`openapi-typescript` (+ `--enum-values`) remains the app's type source**, and
  `openapi-msw`'s `paths` source. The generated client module exports its own schema
  types, but app code never imports them: one naming firewall (the facade), one source
  of runtime enum arrays. The facade's annotated return types are where the two
  generated artifacts meet, so drift between the generators is a `tsc` error.
- **`--tanstack` and `--msw` generation not adopted.** The Queries layer's key hierarchy
  and the dev-seed handler design are the architecture under study; generating them
  would replace the subject of the experiment.
- **Success-only validation accepted.** typed-openapi validates `ok` responses; error
  bodies arrive parsed but unvalidated on `TypedStatusError`. No playground reads an
  error body today.

## Decision

Adopt **D**. [setup.md](../architecture/setup.md) carries the generation pipeline and
the canonical `api-client.ts` (ky fetcher + `createApiClient`);
[layers/api.md](../architecture/layers/api.md) carries the facade rules and the client's
call shapes; [layers/container-hook.md](../architecture/layers/container-hook.md) carries
the `TypedStatusError` idiom that replaces ky's `HTTPError`. Pilot playground:
incident-board; other playgrounds remain snapshots per the drift policy.

## Why D over C

C's cost is invisible until it fires: the schema argument is optional at every call
site, and forgetting it is not an error — the request still runs, still typed, back to
trusting the cast. D moves the same zod schemas behind a generated binding where
forgetting is not expressible. What D pays is generator lock-in at the transport seam,
and the seam is built to contain it: the fetcher and the facade are the only two files
that know typed-openapi exists.

## Revisit triggers

1. **A request is built from runtime input outside typed code** — a dynamic filter
   builder, params not pinned by `satisfies` — and the input side loses its TS
   guarantee: re-hear `validate: "output"`.
2. **A contract gains an error envelope the UI renders**: success-only validation now
   has a real gap; re-hear error-body validation (typed-openapi documents output
   validation as success-only).
3. **typed-openapi cannot express a contract this workspace needs, or stalls
   unmaintained**: swap inside the seam; C is the fallback to re-hear, with the
   binding problem reopened.
4. **The Queries layer starts hand-mirroring what `--tanstack` would generate**: that
   flag deserves a re-hearing against ADR 0007's one-hook-per-page shape.
