# ADR 0014: Requirements are an append-only checklist in the playground README; a committed, disposable plan gates implementation one requirement at a time

- Status: Accepted
- Date: 2026-08-21

## Context

A session can generate a whole feature faster than its owner can read it. The fifteen
steps of [workflow.md](../architecture/workflow.md) commit 10–13 times per page; the
Component commit alone runs to +900 lines (`425d8e0`, travel-expense). A review that consists of reading the
code does not scale to that volume, and the only human checkpoint the repository had was
*after* generation — the sub-component split proposal in CLAUDE.md's Future Work.

The guide decides **how** to build, and on purpose does not decide **what**. Its
Decisions tables hand criteria to the implementer — whether a view model is written,
which states the catalog shows, what the wording is — and record no answers
(`layers/view-model.md`; `testing/storybook.md`: "a menu, not a checklist"). So a
reviewer checking *what was built* has nothing to compare against and reconstructs the
intent while reading; that reconstruction is the expensive part, not the line count.

There was also no home for a choice the owner makes deliberately against or beside the
guide. CLAUDE.md's "ask or fix the docs" fires only when the docs are unclear, and an
ADR is for rules ("if you cannot name a rejected option, there is nothing to record").
A page built without a view model *on purpose* is indistinguishable from drift to the
next session, which will roll it back in good faith.

Spec-driven tooling (Kiro and its peers) answers this with three documents per
feature — requirements in EARS form, a design, a task list — and approval gates between
them (<https://kiro.dev/docs/specs/>). Two first-hand evaluations from 2025 describe the
same failure modes — a small fix expanding to sixteen acceptance criteria, reviewers who
would rather review the code than the Markdown, documents that go stale because nothing
syncs code back into them, agents that mark tests done without writing them
(<https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>,
<https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html>).
Option A below rejects that shape on this repository's own grounds.

## Options considered

### A — three documents per feature (requirements / design / tasks), Kiro-style

Rejected. Each EARS line maps to one test, and the test is the form CI verifies — the
prose copy rots from the first iteration commit on. A task list duplicates
workflow.md, whose fifteen steps already *are* the task template. A prose design
restates `openapi.yaml` and loses every disagreement with it, because `tsc` reads the
contract and nobody reads the prose. The reported review fatigue is a property of this
shape, not of the teams that hit it.

### B — a design document frozen in the pull request

Write, approve, match at review, let it die at merge. Rejected. The choices that need
protecting most are the ones that leave **no file behind** — "no view model on this
page" — so there is no code site for a comment and, after merge, no in-tree reader: a
later session adding a page never opens the PR. The repository also develops on `main`
without a PR flow.

### C — feature-scoped decisions in `docs/adr/`

Rejected. A record in `docs/adr/` binds every future feature and sits on the permanent
reading path (the [ADR index](./README.md#records)). Feature-local choices there would blur the one
boundary that matters — which decisions go through the ADR gate — and put stale
behaviour records where every session reads them.

### D — requirements and decisions in the playground README, a disposable plan, one requirement per run (chosen)

Three commands, two files, the existing checklist:

- `playgrounds/{name}/README.md` holds **what to build** as an append-only checklist —
  one line per requirement, written as the sentence that becomes its test name — plus a
  dated `## Decisions` list of choices made on purpose. It is the requirement *history*;
  it never claims to describe current behaviour.
- `playgrounds/{name}/plan.md` holds **this run's scope** (which lines, in which order)
  and **what is done on purpose** against the guide. It is committed (the commit is the
  approval) and deleted when its scope is fully checked.
- One `/implement` run takes one unchecked requirement, walks only the workflow.md steps
  it needs, writes a test named by the requirement line, checks the line off, and stops.

A narrower variant — an in-tree log of which Decisions-table criterion matched — was
drafted and dropped: a match is re-derivable from the guide and the code, so the log
has no reader. Only intent and deliberate departures are worth keeping.

## Sub-decisions

- **`[x]` is a receipt, not a spec.** A line is checked only when a test with the
  identical string exists and passes; the test is the living acceptance criterion, the
  checked line records that it was delivered. A checked line that later stops describing
  the app is not a bug — it is history.
- **README is append-only.** A changed requirement is a new line plus a strike-through
  with `(superseded YYYY-MM-DD)` on the old one; superseded lines are neither
  implemented nor counted as receipts. Editing the old line in place was rejected
  because it erases the history the file exists to keep.
- **One plan per playground, at a fixed path, overwritten by the next `/plan`.** When
  the scope is fully checked, `/implement` copies the plan's "On purpose" lines verbatim
  into `## Decisions` with the completion date and deletes `plan.md`. Nothing that
  outlives the run lives only in the plan.
- **Escalation boundary.** A plan-level choice stays feature-local when it answers a
  judgement the guide delegates (wording, catalog states, the skip rules) or scopes an
  experiment to a page. A choice that contradicts a stated rule or would bind future
  features is a rule change: ADR first, then the guide — plan approval is not an ADR.
  The same "on purpose" line argued in a second playground is the promotion trigger,
  as for the [held-back list](./README.md#records).
- **Commands take the playground name explicitly** (`/plan book-loans`,
  `/implement book-loans`; `playgrounds/book-loans` is accepted and normalised).
  Inferring the target from the unique `plan.md` or from the working directory was
  considered and rejected: it is ambiguous as soon as two plans exist, and a slash
  command has no working directory of its own.
- **Nothing enforces the receipt today, and that is a known cost.** Lefthook runs
  `tsc` only and there is no CI, so the guarantee is the human matching plan against
  tree and `[x]` lines against test names; the prose in a SKILL.md is not a guarantee.
  The mechanical checks that would close this — a pre-commit script
  (`scripts/check-playground-readme.mjs`: README append-only, `[x]` ↔ same-named test,
  flipped lines ⊆ plan scope) beside Lefthook's typecheck, and CI running `pnpm test` —
  are not yet written. What cannot be linted at all (a file written *on purpose* not at
  all) rests on `## Decisions`.
- **Older playgrounds are not retrofitted.** The README files already in `family-todo`
  and `novel` are usage notes and stay as they are. Back-filling requirement lines from
  existing tests was not taken: a line written after its test is a description, not a
  receipt.

## Decision

Adopt **D**. [workflow.md](../architecture/workflow.md#requirements-plans-and-runs) is
normative for the README and plan conventions and for what one run does; the three
commands live in `.claude/skills/` and follow it. Review becomes matching — README
`[x]` lines against test names, plan scope against the file and commit lists, the
guide against the tree — and the code body is opened only when a match fails.

## Revisit triggers

1. **A playground's `## Decisions` line is cited as precedent in another playground**:
   it is a rule. Promote it through the ADR gate and mark the README line
   `(promoted to ADR N, YYYY-MM-DD)` — the README stays append-only.
2. **`## Decisions` entries start being written in the present tense, or the README
   grows a section that describes current behaviour**: the file is becoming the spec
   this ADR refused; re-read option A's failure modes before accepting it.
3. **Runs are fully automated end to end**: the plan commit as approval needs a
   machine-checked equivalent (a required check on the plan commit, or a protected
   branch); re-decide where the human gate lives.
4. **A PR flow is adopted on this repository**: option B's frozen document becomes
   cheap; re-hear whether the plan should live in the PR instead of the tree.
