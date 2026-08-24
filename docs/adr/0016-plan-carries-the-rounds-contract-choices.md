# ADR 0016: The round's contract choices are named in the plan, in a required `## Contract` section

- Status: Accepted
- Date: 2026-08-24

## Context

[ADR 0014](./0014-requirements-in-the-playground-readme.md) fixed `plan.md` at two
sections: `## Scope`, which quotes README lines verbatim, and `## On purpose`, which holds
what the run does deliberately against the guide. A requirement line is a behaviour and a
test name, so `filters the books by title` settles what the page does and nothing about
how the filter travels.

Where that is actually settled is `src/openapi.yaml`'s query parameters, written in step 1
of the run, with the page's search schema pinned to them by `satisfies`
([url-state.md](../architecture/url-state.md)). The guide hands the run criteria for
whether a value belongs in the URL at all, whether it defaults or is optional, and what a
malformed value does — and none for what it is called, how many results a page holds, or
which sort orders are offered. Those are chosen inside the run, in its first commit, and
their owner first sees them in a diff. They are as visible as display wording: a query
string is shared, bookmarked and read.

`## On purpose` cannot hold them. It is for departures, and workflow.md tells the plan not
to list judgements the guide delegates and the run merely applied. A parameter name is
neither a departure nor an applied criterion — the guide has no opinion to depart from.

## Options considered

### A — leave them to the run (status quo)

Rejected. The one gate this repository has sits before generation; a choice made in the
run's first commit passes it unseen. Renaming a parameter afterwards moves the contract,
the search schema, the handlers and the tests that quote them.

### B — `/implement` stops after step 1 so the contract itself is reviewed

Rejected, though it is the option with no prose in it. Step 1 **is a commit**: by the time
it can be read it is in history, so a rejected name is undone by rewriting a committed
contract rather than by editing a draft. It also puts a second, interactive gate inside a
command whose contract is one requirement per run, with no rule for what resuming means.

### C — a required `## Contract` section in the plan (chosen)

The choices are stated as one line each, before anything is written, in the file whose
commit is already the approval. `/implement` reads it as input and copies nothing: unlike
"On purpose", these choices leave a typed artifact behind — `openapi.yaml` and the search
schema are the record that survives the plan's deletion.

**The cost, paid on purpose.** This is prose beside a typed artifact, the shape ADR 0014
refused for a persistent design document. Two things keep it from becoming one. The file
is deleted when its scope closes, so plan and contract can disagree for one round at most,
and the contract wins by being the thing `tsc` reads. And the section is bounded to the
choices themselves — one line each, never a field list, never a type. A `## Contract`
section that restates `openapi.yaml` is the failure 0014 named, and trigger 1 below is
where it gets caught.

`- (none)` is the honest entry for a round that adds no endpoint and no parameter, the way
`## On purpose` already works.

## Decision

Adopt **C**. [workflow.md](../architecture/workflow.md#requirements-plans-and-runs) is
normative for the plan's shape; `/plan` drafts the section and stops on it with the rest of
the draft, and `scripts/check-playground-readme.mjs` rejects a staged plan without it.

## Revisit triggers

1. **A `## Contract` section lists fields, types, or an endpoint's whole shape.** It is
   becoming the design document 0014 refused; cut it back or re-hear B.
2. **A plan's contract lines and the contract commit disagree, and it is noticed a round
   later.** The section needs a machine check against `openapi.yaml`, or it needs to go.
3. **The same contract choice is argued again in a second playground** — a page size, a
   sort spelling. It is a rule rather than a round's choice, and goes through the ADR gate.
