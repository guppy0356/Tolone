# Loading State

Which loading flags a [container hook](../layers/container-hook.md) returns, what each
one means, what the [Component](../layers/component.md) renders from it, and how it is
named.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Which flags does the hook return? | The ones the page actually renders, and no others. A list page returns `isPending` + `isRefetching`; a form that navigates away just `isPending`; a search picker just `isFetching` | ↓ The flags |
| Is the query gated by `enabled`? | Gated → `isLoading`. `isPending` also means "not asked yet", so it would hold a Skeleton on screen forever | ↓ Two behaviours that are easy to get wrong |
| Does the hook expose more than one query? | Two or more → flags carry the resource name (`isReportsPending`, `isTeamsPending`, `isCommentsLoading`). One → plain (`isPending`, `isFetching`, `isLoading`) | ↓ Naming |

## The flags

| Flag | TanStack Query meaning | Renders |
|---|---|---|
| `isPending` | no data yet | Skeleton |
| `isRefetching` | `isFetching && !isPending` — data is on screen | opacity overlay |
| `isFetching` | any fetch, the initial one included | inline indicator that should also show on first load |
| `isLoading` | `isPending && isFetching` — a first fetch is actually in flight | Skeleton, **for a query gated by `enabled`** |

`isRefetching` excludes the initial load, so the Skeleton is never dimmed: the overlay
only dims content already on screen during a background refetch.

## Two behaviours that are easy to get wrong

**A query gated by `enabled` stays `isPending`.** Disabled means no data *and none
requested*, which is still `status: "pending"`. There `isPending` reads "not asked yet
**or** loading" and would hold a Skeleton on screen forever. Use `isLoading`.

**`isRefetching` also covers a key change.** When the query key changes and
`placeholderData: keepPreviousData` keeps the previous result on screen, that is a fetch
with data showing — the same flag, the same overlay. Nothing extra is needed to dim a
list while a new filter loads.

## Naming

The resource name goes in **front** of the flag, whichever flag it is — so each consumer
knows which resource it is waiting on. A single-query hook has nothing to disambiguate
and names its flags plainly.
