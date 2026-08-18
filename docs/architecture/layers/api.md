# API Layer

`src/api/{Resource}.api.ts`

## Responsibility

HTTP communication and the contract's types. One file per resource, in the shared cache
layer under `src/api/`, imported everywhere through the `@api` alias. It is the only
layer that builds a request, and the only one that names the contract's types for the
rest of the app.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this endpoint take parameters? | Declare its params type here, beside the response types — this layer's own fetcher is what takes it | ↓ Where a params type lives |
| Does a contract type collide with a DOM global? | `Comment`, `Range`, `Selection`, `Event` — prefix with the resource (`IncidentComment`) | ↓ Renaming on collision |
| Who checks the response against the contract? | The generated client parses and validates every success response; a violation throws at this boundary, not in a render | ↓ The generated client |

### Where a params type lives

Everything upstream imports it from here — the Queries layer's key, the container hook's
argument, a URL schema pinned to it with `satisfies`. The dependency only ever runs
Queries → API, so one shape travels Container → hook → Queries → API and no layer
reshapes it in transit.

### Renaming on collision

A contract schema re-exported under its own name shadows `lib.dom` **only in files that
import it**. A call site that forgets the import silently binds to the global instead,
and neither spelling is a type error — so nothing catches it. The prefix is what keeps
the two apart.

## Rules

- Pure functions only — no React dependency
- Use the `api` client from `src/lib/api-client.ts`
- Types come from the generated contract module `src/lib/api.gen.ts` and are renamed
  here. This facade is the only app code that imports them: everything upstream gets
  the contract's names from `@api`, so the contract still enters the app in one file
  ([ADR 0013](../../adr/0013-single-generator-hand-rolled-mock-typing.md))
- Re-export types as named aliases for use by other layers
- Responses arrive parsed and validated against the contract; fields the contract does
  not declare are stripped. No `.json<T>()` casts
- No error handling — delegate to the caller. Mapping a `TypedStatusError` to a domain
  flag is the [container hook](./container-hook.md)'s job
- No query keys and no TanStack Query options — those live in the
  [Queries layer](./queries.md)

## Example

```ts
// Todo.api.ts
import { api } from "../lib/api-client";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "../lib/api.gen";

export type { Todo, CreateTodoInput, UpdateTodoInput };

export const todoApi = {
  getAll: (): Promise<Todo[]> => api.get("/api/todos"),
  create: (input: CreateTodoInput): Promise<Todo> =>
    api.post("/api/todos", { body: input }),
  update: (id: string, input: UpdateTodoInput): Promise<Todo> =>
    api.patch("/api/todos/{todoId}", { path: { todoId: id }, body: input }),
  delete: (id: string) =>
    api.delete("/api/todos/{todoId}", { path: { todoId: id } }),
};
```

Paths are the contract's own literals — `{todoId}` filled through `path`, never a
template string — so a facade line and the `openapi.yaml` entry it calls read the same.

When the list is filterable, the params type joins the response types and the parsed
params object is handed to the client as `query` — its encoder writes a repeated key
once per array element, so `status: ["open", "done"]` goes out as
`status=open&status=done`:

```ts
// Todo.api.ts — the parameterized list that Todo.queries.ts's list(params) consumes
import type { get__api_todos } from "../lib/api.gen";

// A query-parameter type is generated onto the endpoint, not among the schemas.
export type TodoListParams = NonNullable<
  get__api_todos["parameters"]["query"]
>;

export const todoApi = {
  getList: (params: TodoListParams): Promise<Todo[]> =>
    api.get("/api/todos", { query: params }),
  // ...
};
```

## The generated client

The shared instance lives in `src/lib/api-client.ts` ([setup](../setup.md)), a
`createApiClient` over `src/lib/api.gen.ts` with ky as the fetcher — ky's documented
retry and timeout still apply underneath. Its call shapes as this layer uses them:

| Call | |
|---|---|
| `api.get("/api/todos")` | GET → the parsed, validated data — no `Response`, no cast |
| `api.get("/api/todos", { query: params })` | plain params object; an array value repeats its key |
| `api.get("/api/todos/{todoId}", { path: { todoId } })` | path params by contract name |
| `api.post("/api/todos", { body })` | POST; `patch` / `delete` alike |

Failure is uniform: a non-2xx status throws `TypedStatusError` (after ky's retries), a
success body that breaks the contract throws zod's error right here — never `undefined`
drifting into a render
([ADR 0012](../../adr/0012-generated-client-validates-responses.md)).
