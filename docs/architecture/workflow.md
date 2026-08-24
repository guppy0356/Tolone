# Adding a Feature

The order to build in, and the file to read at each step. Read
[the overview](./overview.md) first if you have not.

**Commit after each step.** Do not batch multiple steps into one commit. Every commit must
pass the touched playground's typecheck (`pnpm --filter <pkg> exec tsc --noEmit -p .`) —
enforced by the Lefthook pre-commit hook.

## Why routes come early

Steps 6 and 15 are two halves of one job: **declare the URLs first** (path + spread route
options, no `component:`), **attach the Containers last**. The type cycle that forces the
split is
[The route tree types the Component](./routing.md#the-route-tree-types-the-component).

## Requirements, plans, and runs

A feature enters a playground as **requirement lines** in the playground's `README.md`,
and an implementation run starts from a **committed `plan.md`**. The three commands that
drive this live in `.claude/skills/` — `/enjoy-playground <description>`, `/plan <name>`,
`/implement <name>` — and the reasoning is
[ADR 0014](../adr/0014-requirements-in-the-playground-readme.md). This applies to
playgrounds created by `/enjoy-playground`; the README files of older playgrounds are usage
notes, and `/plan` and `/implement` stop on a README without `## Requirements`.

**`README.md`** — what to build, kept as history. Under `## Requirements`, one top-level
bullet per page, named by the address it answers on — `/enjoy-playground` derives the map
from the description and the user approves it with the draft
([ADR 0015](../adr/0015-url-map-decided-at-enjoy-playground.md)) — and beneath it,
indented two spaces, one checkbox line per requirement — no headings, no blank lines
inside a group:

```markdown
- /my/loans
  - [ ] shows my loans
  - [x] marks a loan as overdue when the due date has passed
  - [ ] ~~lists loans newest first~~ (superseded 2026-08-21)
```

A **requirement line** is the sentence after `- [ ] ` — no marker, no indentation, one
line, English, phrased as the behaviour it names. It is the test's name and what the plan
quotes. One line is one `test()`: what a single fixture lets one test assert is one line
(the fields a row shows); a behaviour that needs its own fixture or condition — a past due
date, an empty list, a failed request — is its own line.

The file is append-only. A committed line gets exactly two edits, ever: `[ ]` → `[x]` by
`/implement`, and `~~sentence~~ (superseded YYYY-MM-DD)` by `/plan` when a newer line
replaces it — the `- [ ]` / `- [x]` prefix stays, only the sentence is struck. The flip is
a receipt: a line is checked only when a test named by the identical string exists and
passes. A requirement line always gets that test, even when its state is reachable through
`args` and so also has a catalog story — the story is the catalog, the test is the receipt;
the story-or-test criterion in [testing/overview.md](./testing/overview.md#decisions)
governs everything beyond the requirement lines. A struck-through line is neither
implemented nor counted, and its test may be deleted. Iteration after the steps below does
not touch the README — tests and stories record behaviour.

Under `## Decisions`, choices made on purpose against or beside this guide are appended as
dated lines (`- YYYY-MM-DD MyLoans: …`, copied from the plan when its scope closes);
reversing one appends another line ending in `(reverses YYYY-MM-DD)`, naming the date of
the line it reverses — the one README edit made by hand, outside the commands.

**`plan.md`** — this run's scope, at `playgrounds/{name}/plan.md`, one per playground,
in exactly this shape:

```markdown
# Plan — <short title of this round>

## Scope (in this order)

1. /my/loans — shows my loans
2. /my/loans — shows the due date of each loan

## On purpose

- MyLoans: no view model on purpose; the overdue rule is tried in a sub component.
```

Each Scope entry is `<group line, verbatim> — <requirement line, verbatim>`; the
requirement line is everything after the first ` — `, so a group name never contains
` — `. Scope holds unchecked, non-superseded lines in execution order: the behaviour that
makes the page exist first, its variations next, edge and failure cases last. `## On
purpose` holds what the run does deliberately against the guide, or as an experiment — one
statement per line, prefixed with the page it scopes, `- (none)` when there is nothing —
not the judgements the guide delegates and you merely applied. **The user commits the
plan; that commit is the approval**, and `/implement` refuses to run without it. The next
`/plan` overwrites the file; `/implement` deletes it once every line in scope is checked,
after copying "On purpose" into `## Decisions`.

Feature-local or rule change: the guide hands the implementer a choice — a Decisions-table
row, a skip rule's criterion, wording, catalog states — and an "On purpose" line takes the
branch the guide's own criterion would not have picked (a view model written where the
translation carries no decision; a Skeleton skipped on a page that never loads). That is
feature-local and stays in the plan. A line that contradicts a path the guide states with no
criterion (the Container holds no state; a `[x]` needs a same-named test), or that is
written for more than this page, is a rule change and goes through the
[ADR gate](../adr/README.md#what-goes-here) first; plan approval is not an ADR. Applying a
criterion as written is neither — do not list it. Where a departure has a code site, a
one-line comment at that site names the `## Decisions` or "On purpose" line that covers
it; a departure with no code site (a file written on purpose not at all) is visible only
through those lines.

**A run** — `/implement <name>` takes the first unchecked line in plan order, walks only
the steps below that the line needs, and stops. The first requirement of a page walks steps
1–15 (each conditional step by its own skip rule) and removes the scaffold's placeholder
route and Welcome story as the first page replaces them; a later one touches only the steps
whose file changes — often one or two commits, but a new field or path walks steps 1–3 and
13 again. The test named by the line is written at the step that owns its file (step 12
for a new page's Component test), and the line is checked off in the run's last step's
commit — never in a commit of its own. Re-running resumes from the README and the plan on
disk.

## The steps

1. Define endpoints and schemas in `src/openapi.yaml` → **commit**
   — [Setup](./setup.md)
2. Run `pnpm generate:api` to generate the types and the validating client → **commit**
   — [Setup](./setup.md)
3. `src/api/{Resource}.api.ts` — generated types + the API facade over the generated
   client; rename anything that collides with a DOM global → **commit**
   — [API layer](./layers/api.md)
4. `src/api/{Resource}.queries.ts` — the `queryOptions()` factory (`all` / `list` /
   `detail`) over the API functions → **commit**
   — [Queries layer](./layers/queries.md)
5. Create `src/features/{feature-name}/{Page}/`
   — [Directory structure](./conventions/directory-structure.md),
   [Naming](./conventions/naming.md)
6. **Routes before Components.** When any page keeps state in the URL, write its URL
   contract. Then declare every route of the feature: `{Page}.route.ts` with path + spread
   route options and **no `component:`**, registered in `router.ts`'s `addChildren` →
   **commit**
   — [URL state](./url-state.md), [Routing](./routing.md)
7. `{Page}.container.hook.ts` — `use{Page}Container` + `{Page}ContainerState`. Pick the
   mutation side-effect pattern. When the hook holds logic worth testing in isolation
   (error mapping, hook-scoped query params), add its test in the same commit → **commit**
   — [Container hook](./layers/container-hook.md),
   [Loading state](./conventions/loading-state.md), [Hook tests](./testing/hook.md)
8. `{Page}.schema.ts` — zod form contract + `z.infer` type, output pinned to the API input
   via `satisfies` (**only when the page validates a form**) → **commit**
   — [Form schema](./layers/form-schema.md)
9. `{Page}.view-model.ts` — the shapes the Component receives + one pure function per
   record; constants for option lists that depend on nothing (**skip this file entirely**
   when the translation carries no decision — contract values rendered as they arrive
   need no view model) → **commit**
   — [View model](./layers/view-model.md)
10. `{Page}.component.hook.ts` — `use{Page}Component` + `{Page}ComponentState`, memoizing
    the view model's functions and wrapping handlers (**skip this file entirely** when the
    Component has no local state and nothing to derive) → **commit**
    — [Component hook](./layers/component-hook.md)
11. `{Page}.component.tsx` — the exported Component + private memo'd body + private
    Skeleton
    — [Component](./layers/component.md), [Type patterns](./conventions/type-patterns.md)
12. `{Page}.component.stories.tsx` — catalog states through `args`, no `play` — and
    `{Page}.component.test.tsx` — behavior assertions. Navigating Components use the shared
    minimal router. Run `pnpm test` to verify → **commit** (Component + stories + tests
    together)
    — [Stories](./testing/storybook.md), [Component tests](./testing/component.md),
    [Test wiring](./testing/wiring.md)
13. Add typed mock handlers to `src/mocks/handlers.ts` → **commit**
    — [Mocking](./mocking.md)
14. `{Page}.container.tsx` — reads app-shell inputs, calls the container hook, passes
    fields to the Component → **commit**
    — [Container](./layers/container.md)
15. Point each route at its Container: add `component: {Page}Container` to the
    `{Page}.route.ts` written in step 6 → **commit**
    — [Routing](./routing.md)
