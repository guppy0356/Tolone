# Architecture Decision Records

An ADR holds what [the guide](../architecture/overview.md) structurally cannot: **the
options that were not taken**, and **the conditions under which one of them becomes
right**.

The guide states one path, so a rejected option never appears in it — and never appears
in git either, since what was never written is not a diff. That is the whole reason these
files exist.

## What goes here

Write one when any of these holds:

| Trigger | Example |
|---|---|
| The rule **reads as wrong** — a reader will try to "fix" it | [0003](./0003-per-page-display-wording.md), two pages repeating a label table |
| A **conflict had to be resolved** — the losing side leaves no trace | [0002](./0002-sub-component-stories.md) |
| The rule goes **against the ecosystem default** | [0005](./0005-stories-are-a-catalog-not-a-test.md), [0008](./0008-browser-mode-not-jsdom.md), [0009](./0009-two-msw-worker-instances.md) |
| A **known cost is being paid** on purpose | [0004](./0004-container-holds-no-state.md) |

Do **not** write one for a rule that is simply correct. If you cannot name a rejected
option, there is nothing to record — `--enum-values` emitting a `.ts` is a consequence of
the type system, not a decision.

Two more rules of thumb:

- **Write it in the conversation that decided it.** A week later the alternatives have to
  be reconstructed, and a reconstruction is not a record.
- **Make revisit triggers situational, not scheduled.** "When SSR is adopted" fires while
  someone is already in the code. "Every six months" fires never.

## How they relate to the guide

The guide is rewritten when a rule changes; an ADR is not. So an ADR's Decision section
names the guide file that is normative *now*, and the guide links back from the one place
the rule is stated — a pointer, never a summary. When a decision is replaced, the old ADR's
Status becomes `Superseded by ADR N` rather than being edited.

## Records

| # | Decision | Status |
|---|---|---|
| [0001](./0001-route-definition-placement.md) | Route definitions are page-owned files composed by a central router module | Accepted |
| [0002](./0002-sub-component-stories.md) | An extracted sub-component gets a behavior test and no catalog story | Accepted |
| [0003](./0003-per-page-display-wording.md) | Display wording belongs to the page that renders it, and two pages repeat it | Accepted |
| [0004](./0004-container-holds-no-state.md) | The Container holds no state; it exists to call the container hook from outside the Component | Accepted |
| [0005](./0005-stories-are-a-catalog-not-a-test.md) | Stories are a catalog with no `play`; behavior lives in `*.test.tsx` | Accepted |
| [0006](./0006-url-read-in-container-written-in-component.md) | The Container reads the URL; the Component writes it | Accepted |
| [0007](./0007-one-container-hook-per-page.md) | One dedicated container hook per page, never shared across pages | Accepted |
| [0008](./0008-browser-mode-not-jsdom.md) | Tests run in a real browser, not jsdom | Accepted |
| [0009](./0009-two-msw-worker-instances.md) | The dev seed worker and the test worker are separate instances | Accepted |
| [0010](./0010-worker-script-sync-at-the-root.md) | The worker scripts are synced by the root project's own postinstall | Accepted |
| [0011](./0011-view-model-only-with-decisions.md) | A view model is written when the page's translation carries a decision, and skipped when it does not | Accepted |
| [0012](./0012-generated-client-validates-responses.md) | Responses are validated at the fetch boundary by a client generated from the contract | Accepted¹ |
| [0013](./0013-single-generator-hand-rolled-mock-typing.md) | typed-openapi is the single generator; mock typing is hand-rolled over its output | Accepted |
| [0014](./0014-requirements-in-the-playground-readme.md) | Requirements are an append-only checklist in the playground README; a committed, disposable plan gates implementation one requirement at a time | Accepted |
| [0015](./0015-url-map-decided-at-enjoy-playground.md) | The URL map is decided when the requirements are written, and recorded as the README's group lines | Accepted |
| [0016](./0016-plan-carries-the-rounds-contract-choices.md) | The round's contract choices are named in the plan, in a required `## Contract` section | Accepted |

¹ 0012's type-source sub-decision (openapi-typescript remains beside typed-openapi) is
superseded by 0013; its decision — the generated validating client — stands.

Held back deliberately, as decisions whose rejected options are real but narrow: the
sibling-key shape for sub-resources (`layers/queries.md`) and the exported-route-options
form (`url-state.md`). Write them if they start being re-argued.
