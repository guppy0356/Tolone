---
name: plan
description: Write playgrounds/<name>/plan.md — this round's requirement lines in execution order and what is done on purpose against the guide — then stop for the user's approving commit. Follow with /implement.
argument-hint: <playground-name> [anything about this round]
disable-model-invocation: true
allowed-tools: Bash(ls:*), Bash(find:*)
---

# /plan

Decides, with the user, what the next implementation rounds cover and what they do on
purpose against the guide. The plan is the one place those choices get made before any
code exists, and the user's commit of it is the approval `/implement` requires. The file
shapes and rules are defined once in
[workflow.md § Requirements, plans, and runs](../../../docs/architecture/workflow.md#requirements-plans-and-runs);
this file only says what the command does. Paths are relative to the repository root.

Existing playgrounds: !`ls "${CLAUDE_PROJECT_DIR}/playgrounds"`
Plans in progress (blank = none): !`find "${CLAUDE_PROJECT_DIR}/playgrounds" -mindepth 2 -maxdepth 2 -name plan.md`

## Input

`$ARGUMENTS` — the first word is the playground name; anything after it is free text
about this round (which requirements, new requirements, an experiment to try). Accept the
name as `book-loans`, `playgrounds/book-loans`, or either with a trailing slash; strip the
prefix and the slash. If `$ARGUMENTS` is empty or `playgrounds/<name>/` does not exist,
print the list above and stop — do not guess a near name.

## Steps

1. **Read** `playgrounds/<name>/README.md`, `playgrounds/<name>/plan.md` if present, and
   the workflow section linked above. If `README.md` is missing or has no
   `## Requirements`, stop: the playground predates ADR 0014 — start one with
   `/enjoy-playground`, or the user adds the section by hand first.
   If a plan exists, judge each Scope line by its README line (`[x]` = checked; match on
   the requirement sentence):
   - every line checked → stop with `Run /implement <name> to close it first` — Close
     copies "On purpose" into `## Decisions` and deletes the plan; `/plan` never does;
   - some line unchecked → say so and ask whether to replace it (the old plan stays in
     git history). On yes, start the new Scope from the old plan's unchecked lines and
     carry every old "On purpose" line over verbatim — the rationale behind an
     already-implemented line must not vanish with the plan; the user strikes what no
     longer applies.
2. **New requirements, if the free text adds any — draft them in the reply, not on
   disk.** One `- [ ]` line per behaviour under its group (name the group; say when it
   is new), in the README shape and granularity workflow.md gives. Translate what the
   user said; when the free text names an area but no behaviour (`次は返却期限まわり`),
   ask for the behaviours or propose candidates marked `(proposed)` — never write a line
   the user has not seen in its final wording. A changed requirement is a new line plus
   `- [ ] ~~old sentence~~ (superseded YYYY-MM-DD)` on the old one — the prefix stays,
   only the sentence is struck. A committed line gets no other edit, ever; lines drafted
   in this run may be reworded freely until step 5.
3. **Draft `plan.md` in the reply — not on disk — in the exact shape workflow.md
   gives.** Scope: the unchecked, non-superseded lines the free text points to; with no
   free text, every unchecked line of the first group that has one. When a picked line
   belongs to a page whose existence line (the one that makes the page exist) is still
   unchecked, put that line first and say so — it cannot be left behind. Order as
   workflow.md says. "Contract": the choices this round's endpoints and parameters leave
   open — what a filter is called, how many rows a page holds, which sort orders are
   offered — one statement per line, prefixed with the page or path it scopes, and each
   one you are choosing rather than quoting marked `(proposed)` and phrased as a
   question. `- (none)` when the round adds no endpoint and no parameter. The choice,
   never the schema — a field list is `openapi.yaml`'s. "On purpose": what the user
   stated, as statements prefixed with the
   page they scope (`MyLoans: …`), plus anything you want to propose — each proposal
   prefixed `(proposed)` and phrased as a question. `- (none)` when there is nothing. Do
   not list judgements the guide delegates and you merely applied; do not restate guide
   rules.
4. **Hear the user.** Show both drafts; ask them to confirm or reorder the scope and to
   answer every `(proposed)` item. If an item contradicts a path the guide states with no
   criterion, or is written for more than this page, say so: that is a rule change, not a
   plan line — leave it out. If the user wants the change, write the ADR and the guide
   edit now, in this conversation, as their own commit (ADR + guide link together, per
   CLAUDE.md) **before** the plan, then re-draft the plan against the updated guide,
   where the item is no longer "on purpose".
5. **On approval, write the files and stop for the commit.** First rewrite every
   accepted proposal as a statement and drop the declined ones — `plan.md` holds no
   questions. The "On purpose" ones are what `/implement` copies verbatim into
   `## Decisions`; the "Contract" ones are consumed by the run's step 1 and die with the
   plan, since `openapi.yaml` is what survives it. Append the
   approved requirement lines to `README.md` (show the diff), write `plan.md`, then tell
   the user what to stage and the message, and stop without committing:
   `git add playgrounds/<name>/plan.md` (plus `playgrounds/<name>/README.md` if step 2
   added lines; never `-A`, `-u` or `.`), then `git commit -m "Plan <name>: <title>"` —
   the title is the plan's H1. Their commit is the approval `/implement` checks for —
   they run it, or tell you to run exactly that.
6. End with one line: `Review and commit plan.md, then /implement <name>`.
