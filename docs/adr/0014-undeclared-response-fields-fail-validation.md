# ADR 0014: A response field the contract does not declare fails validation; generated objects stay closed

- Status: Accepted
- Date: 2026-10-04

## Context

[ADR 0012](./0012-generated-client-validates-responses.md) put a generated, validating
client at the fetch boundary. Its spike measured the one case this record is about — a
success response carrying a field the contract does not declare — as *silently
stripped*, and the guide said so.

The generator has changed that answer twice since, each time inside a dependency update:

| Commit | typed-openapi | Emitted for an object that omits `additionalProperties` | The undeclared field |
|---|---|---|---|
| `d86ba44` (2026-08-16) | 3.2.1 | `z.object({…})` | stripped |
| `e34b100` (2026-09-06) | 4.0.1 | `z.object({…}).catchall(z.unknown())` | kept, handed to the caller |
| `31ee9b6` (2026-09-27) | 4.1.0 | `z.strictObject({…})` | throws `unrecognized_keys` |

No contract in this workspace writes `additionalProperties`, so every object is on the
generator's default, and 4.1.0 closed that default on purpose: per its
[changelog](https://github.com/astahmer/typed-openapi/blob/main/packages/typed-openapi/CHANGELOG.md),
an omitted `additionalProperties` is treated as `false`, with
`--openapi-additional-properties-default` as the way back to OpenAPI's open default.

Both commit messages recorded the new spelling of the generated file, and
incident-board's tests passed across both. Neither was read as a change of behavior at
the boundary, so the guide went on saying "stripped" through both.

Correcting that sentence is editing. Whether to *stay* on the closed default is not,
because of what it costs at the boundary ADR 0012 designs for: a real server that starts
returning one more field — a change usually treated as backward-compatible — now fails
every call that returns that object, until the contract is regenerated.

## Options considered

### A — keep the generator's default: closed objects (chosen)

An undeclared field is contract drift like a missing one, and fails the same way: zod's
error at the fetch boundary.

### B — open every object (`--openapi-additional-properties-default`)

Rejected. It does not bring stripping back: the emitted schema is
`.catchall(z.unknown())`, so the field is kept and reaches the caller. And the types
open with the schemas — every contract type becomes `{…} & Record<string, unknown>`, so
a misspelled property read compiles and an object literal with an undeclared key is
accepted. That is 4.0.1's output, which this workspace carried for three weeks. The cost
lands today, in every file that reads a contract type, to avoid a failure that needs a
server no playground has.

### C — open chosen schemas (`additionalProperties: true` in `openapi.yaml`)

Not adopted as a policy: it is B for one schema, and no contract here has an object with
a reason to be open. It remains what it always was — the contract's own way to say an
object is free-form — and the generator honors it over the default.

### D — strip, as the guide used to say

Rejected for availability, not merit: it is the only option that tolerates an added
field *and* keeps the types closed. typed-openapi 4.1.0 cannot emit it — the zod emitter
writes `z.strictObject` for a closed object and `.catchall(…)` for an open one, and
`--validation loose` changes constraint depth, not closedness. Getting it back means
hand-written parsing in the client's `onValidate` hook, or pinning the generator at
3.2.1 — either way re-owning what ADR 0012 handed to the generator.

## Measured behavior

2026-10-04 — typed-openapi 4.1.0, zod 4.6.5, TypeScript 7.0.2, msw 2.15.0. A
five-endpoint contract generated in a scratch directory, plus incident-board's
checked-in `api.gen.ts` and `typed-http.ts` copied verbatim:

- A 200 body with one undeclared field throws `ZodError` / `unrecognized_keys` — at the
  top level, on an array item, on a nested object — by direct parse of the endpoint's
  response schema and through `createApiClient(…, { validate: "output" })` alike.
- Error statuses stay unvalidated: a 409 body with an undeclared field arrives on
  `TypedStatusError` untouched (ADR 0012's success-only validation, unchanged).
- The same contract under typed-openapi 4.0.1: the field is kept and reaches the caller.
- `typed-http`'s `.json()` throws on a mock body with an undeclared key. Such a body
  still typechecks when it reaches `.json()` through a variable — only a fresh object
  literal is refused — so the runtime parse is what catches it.
- With `--openapi-additional-properties-default` (or `openapi.additionalPropertiesDefault`
  in a config file; identical output): `.catchall(z.unknown())` on every component
  schema, `& Record<string, unknown>` on every component type. Parameter schemas stay
  `z.strictObject` either way.
- Against incident-board's all-optional list params,
  `satisfies z.ZodType<IncidentListParams, unknown>` rejects a wrong type on a shared
  key and accepts both a renamed parameter and one the endpoint does not take. On the
  scratch contract, handing such an object on to a facade function compiles as well.
- `validate: "output"` sends `{ pageNo: 2 }` as `?pageNo=2`. `validate: "both"` throws
  `unrecognized_keys` before any request is made — and still rewrites what it accepts:
  `{ status: ["open"] }` goes out as `?status=open&page=1`, keys in schema order, and
  `page: 0` throws on the contract's `minimum`. With an `onValidate` hook that parses
  the input and returns the caller's value, the undeclared key is rejected and the wire
  is unchanged.

## Sub-decisions

- **`validate: "output"` stays** — re-heard in the same conversation, on the
  measurements above. ADR 0012's reason, that request shapes are TS-owned end to end,
  has a hole: against an all-optional params type the compiler accepts a stale key, and
  with input validation off that key goes out on the wire. Parameter schemas have been
  strict since 4.0.1, so input validation would now reject it. Kept off regardless.
  `"both"` still injects contract defaults, which is why ADR 0012 turned it off. The
  `onValidate` form avoids that, at the price of hand-written validation policy in
  `api-client.ts`. And the hole opens only when a contract renames or drops a query
  parameter while the URL schema keeps the old name — judged too narrow to pay for
  before it happens.

## Decision

Adopt **A**. [layers/api.md](../architecture/layers/api.md) carries the rule — a field
the contract does not declare fails validation;
[url-state.md](../architecture/url-state.md#what-satisfies-checks-here) carries what
`satisfies` does and does not check on the request side, and that nothing checks the
rest. ADR 0012's decision — the generated validating client — is untouched. Its dated
measurement of this case, and the gap
[ADR 0013](./0013-single-generator-hand-rolled-mock-typing.md) accepted from the same
behavior (`.json()` stripping a mock's undeclared keys), describe typed-openapi 3.2.1
and stay as written; the section above is what the same case does now.

## Why A over B

- **B's cost is paid now and everywhere; A's needs a server no playground has.** Open
  types stop the compiler catching a misspelled field in every file that reads a
  contract type. A's failure needs a server that deploys apart from its contract file.
- **A is ADR 0012's purchase at full strength.** The validating client was bought so
  that drift fails at the boundary instead of in a render. A field the contract does not
  know is drift too, and B would pass it into the app as data nobody typed.
- **A closes a gap in the mock layer for free.** An undeclared key in a mock body now
  fails the test instead of vanishing.

What A gives up: tolerance of additive change. A server adding a field breaks every call
that returns that object until the contract is regenerated — and what fails is the whole
response, not the one field.

## Revisit triggers

1. **A playground talks to a server that deploys apart from its contract file.** A's
   cost stops being hypothetical: re-hear C for the schemas that server extends, then B.
   The same event makes the request-side hole observable — re-hear `validate`.
2. **A contract renames or drops a query parameter.** That is the case `satisfies`
   cannot see: re-hear input validation in its `onValidate` form.
3. **A typed-openapi bump changes how `api.gen.ts` spells an object schema, or adds a
   stripping mode.** The spelling is the behavior — it moved twice before the guide
   caught up — so re-measure. D was rejected for availability only and deserves a
   hearing once it can be emitted.
