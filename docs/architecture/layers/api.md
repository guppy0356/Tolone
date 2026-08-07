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
| Does the URL's shape differ from the HTTP query string's? | The conversion belongs here; a repeated key needs a `URLSearchParams`, which a plain record cannot express | [URL state](../url-state.md) |

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
- Types are derived from the OpenAPI schema via `openapi-typescript` generated types
- Re-export types as named aliases for use by other layers
- No error handling — delegate to the caller. Mapping an `HTTPError` to a domain flag is
  the [container hook](./container-hook.md)'s job
- No query keys and no TanStack Query options — those live in the
  [Queries layer](./queries.md)

## Example

```ts
// Todo.api.ts
import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

export type Todo = components["schemas"]["Todo"];
export type CreateTodoInput = components["schemas"]["CreateTodoInput"];
export type UpdateTodoInput = components["schemas"]["UpdateTodoInput"];

export const todoApi = {
  getAll: () => api.get("todos").json<Todo[]>(),
  create: (input: CreateTodoInput) =>
    api.post("todos", { json: input }).json<Todo>(),
  update: (id: string, input: Partial<Todo>) =>
    api.patch(`todos/${id}`, { json: input }).json<Todo>(),
  delete: (id: string) => api.delete(`todos/${id}`),
};
```

When the list is filterable, the params type joins the response types and the request
carries a `URLSearchParams` — `status` repeats once per selected value, which a plain
record has no way to say:

```ts
// Todo.api.ts — the parameterized list that Todo.queries.ts's list(params) consumes
export type TodoListParams = components["schemas"]["TodoListParams"];

const toQuery = ({ status, page }: TodoListParams) => {
  const query = new URLSearchParams();
  status?.forEach((value) => query.append("status", value));
  if (page) query.set("page", String(page));
  return query;
};

export const todoApi = {
  getList: (params: TodoListParams) =>
    api.get("todos", { searchParams: toQuery(params) }).json<Todo[]>(),
  // ...
};
```

## The ky client

The shared instance lives in `src/lib/api-client.ts` ([setup](../setup.md)). Its methods
as this layer uses them:

| Call | |
|---|---|
| `api.get("endpoint").json<Type>()` | GET |
| `api.post("endpoint", { json: body }).json<Type>()` | POST |
| `api.patch("endpoint", { json: body }).json<Type>()` | PATCH |
| `api.delete("endpoint")` | DELETE |
| `api.get("endpoint", { searchParams })` | pass a `URLSearchParams` when a key repeats |
