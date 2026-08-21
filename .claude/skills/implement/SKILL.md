---
name: implement
description: Implement the next unchecked requirement of a playground's committed plan — one requirement per run, then stop. Needs a plan.md committed by /plan.
argument-hint: <playground-name>
disable-model-invocation: true
allowed-tools: Bash(find:*)
---

# /implement

One run, one requirement. Takes the first unchecked line of the committed plan, walks
only the workflow steps that line needs, writes the test named by the line, checks the
line off, and stops. The rules are stated once in
[workflow.md § Requirements, plans, and runs](../../../docs/architecture/workflow.md#requirements-plans-and-runs);
the steps themselves are the rest of that file. Paths are relative to the repository root.

Plans in progress (blank = none): !`find "${CLAUDE_PROJECT_DIR}/playgrounds" -mindepth 2 -maxdepth 2 -name plan.md`

## Input

`$ARGUMENTS` — the playground name. Accept `book-loans`, `playgrounds/book-loans`, or
either with a trailing slash; strip the prefix and the slash. If it is empty or
`playgrounds/<name>/` does not exist, list `playgrounds/` and stop. Never infer the target
from the working directory or from whichever plan happens to exist.

## Preconditions

- `playgrounds/<name>/README.md` has a `## Requirements` section; otherwise stop — the
  playground predates ADR 0014.
- `playgrounds/<name>/plan.md` exists; otherwise stop with `Run /plan <name> first`.
- It is committed and clean: `git ls-files --error-unmatch playgrounds/<name>/plan.md`
  succeeds and `git status --short playgrounds/<name>/plan.md` prints nothing; otherwise
  stop with `Commit plan.md — the commit is the approval`.
- `git status --short playgrounds/<name>` prints nothing. A dirty playground is a run
  that did not finish — stop with
  `Commit or discard the changes under playgrounds/<name> first`.

## Steps

1. **Read** `README.md` (`## Requirements`, `## Decisions`) and `plan.md`, then the guide
   the way any feature work does: [overview.md](../../../docs/architecture/overview.md) →
   [workflow.md](../../../docs/architecture/workflow.md) and the file each step names.
   Honour `## Decisions` and the plan's "On purpose": code that departs from the guide
   because one of those lines says so is not drift — do not "fix" it.
2. **Pick** the first Scope line whose README line is still `[ ]` and not struck through.
   If none is left, go to **Close** below. If a Scope line matches no README line
   character-for-character, or only a line under a different group, stop with
   `plan.md and README.md disagree — run /plan <name>`; never edit either file to make
   them agree. If the matched line admits two behaviours (a derived state vs a user
   action), stop and ask — the answer becomes a new README line through `/plan`, not a
   choice made in the run.
3. **Walk only the steps the line needs.** Compare what exists — the page directory, the
   paths **and schemas** in `src/openapi.yaml` (absent until the first run's step 1
   writes it), the handlers, the routes — with what the requirement needs, and walk only
   the missing or changed workflow.md steps, in its order, one commit per step as it says
   (Lefthook typechecks each; stage explicitly, never `git add -A`). The first
   requirement of a new page walks steps 1–15, each conditional step (8, 9, 10) by its
   own skip rule, and removes the scaffold's placeholder route and Welcome story as the
   page replaces them; a later one touches only the files that change — usually a branch
   in an existing file plus its test; when the line needs a new field or path, steps 1–3
   (and 13) run again, one commit each.
4. **The test is part of step 3, not after it.** Write
   `test("<requirement line, verbatim>", …)` in the commit workflow.md assigns its file
   to: for a new page, step 12's commit (Component + stories + tests together); for a
   later requirement, the commit that changes the file the behaviour lives in —
   `*.component.test.tsx` beside the Component, or the hook test beside the hook
   ([Hook tests](../../../docs/architecture/testing/hook.md)). Run
   `pnpm --filter @tolone/<name> test` before that commit. The string must be identical
   to the README line — that identity is the receipt. Never commit a red test — Lefthook
   checks types only. If it still fails after fixing the obvious (the Component, the
   test, the wiring in testing/wiring.md, the caches in setup.md), stop: leave the step
   uncommitted, do not flip the line, report the failing assertion and end with
   `Blocked: <what fails>`.
5. **Check the line off** in the last step's commit of this run — step 15's commit for a
   page's first requirement, the test's commit for a later one — by flipping that one
   `- [ ]` to `- [x]` in `README.md`; nothing else in the file changes, and the flip
   never gets a commit of its own.
6. **Stop.** Report the commits made and the next unchecked line, and end with
   `Next: /implement <name>` — or, if the scope is now fully checked, go to **Close**.

## Close (scope fully checked)

1. Append each `## On purpose` line of `plan.md` to README's `## Decisions` as
   `- YYYY-MM-DD <the line's text after its bullet>` with today's date. `- (none)` is
   not copied.
2. `git rm playgrounds/<name>/plan.md`, stage `playgrounds/<name>/README.md`, commit as
   `Close plan for <name>: <title>` — the title from the plan's H1.
3. End with one line: `Next: /plan <name>`.

## Never

- edit or delete an existing README line, or touch a requirement outside the plan's
  scope;
- write requirements, designs, or task lists as prose — the README is the requirement,
  the test is the acceptance criterion, workflow.md is the task list;
- mark a line `[x]` without its same-named passing test, or run past one requirement;
- depart from the guide on a point no `## Decisions` / "On purpose" line covers — stop,
  leave the step uncommitted, and report
  `Blocked: needs a plan line (or an ADR, if it would bind other features)`; deciding it
  is `/plan`'s job, not the run's.

A departure with a code site gets the one-line comment workflow.md asks for, naming the
line that covers it.
