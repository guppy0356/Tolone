# ADR 0015: The URL map is decided when the requirements are written, and recorded as the README's group lines

- Status: Accepted
- Date: 2026-08-24

## Context

[workflow.md](../architecture/workflow.md#requirements-plans-and-runs) shapes the README
as one top-level bullet per endpoint or screen *as the user named it*, with the
requirement lines beneath it. A description given as prose about screens therefore
produces group lines that are screen names, and no address is decided anywhere until
step 6 of the first run that needs one.

A path cannot become a requirement line: a line is the sentence that becomes a test name,
and `/books` names no behaviour. Routing is code-based and page-owned, and `router.ts`'s
`addChildren` is the typed sitemap ([routing.md](../architecture/routing.md)) — so the
address has an implementation and no decision site.

Deciding it inside a run means deciding it with one page in view. `book-shelf` paid both
halves of that in its first run: the registration form took `/`, which the list, the
detail and the shared-review list that follow have to take back, and
[naming.md](../architecture/conventions/naming.md)'s discriminator rule renames its
`Book/` directory the moment a second page exists. Every screen was already named in the
description that produced the README, one command earlier.

`/enjoy-playground` is the only command that sees the whole feature — `/plan` sees one
round, `/implement` one requirement — and it already asks the questions that fix the map:
how many screens there are, and which one owns which behaviour.

## Options considered

### A — leave the address to the run (status quo)

Rejected. The first page of a feature picks paths with no sibling in view, and the
correction arrives as a path change plus a directory rename plus every link that points
at it. The cost falls on the second page, not the one that made the choice.

### B — a `## URLs` section in the playground README

Rejected. [ADR 0014](./0014-requirements-in-the-playground-readme.md)'s revisit trigger 2
names a README section that describes current behaviour as the sign the file is becoming
the spec its option A refused. A map maintained beside the routes is exactly that: the
routes are typed and the section is not, so the two drift and only one of them compiles.

### C — the group line is the page's URL, proposed with the requirements draft (chosen)

The slot already exists. `workflow.md`'s shape allows an address as the group name and
its own example is one; the plan quotes group lines verbatim in every Scope entry
already. Nothing is added to the file's shape — the naming rule for one existing line
changes, and `/enjoy-playground` gains the derivation and proposes the map in the draft
the user already approves before anything is written.

**The cost, paid on purpose.** A group line is append-only like every other committed
line, so changing an address after the fact is a new group plus a superseded copy of
every line under it. The map is decided once, before any code exists, and moving it later
is deliberately expensive. That is the same trade the requirement lines already make.

This does not move the routing source of truth. `router.ts` stays the sitemap and the
only typed record; the group line records the decision, the route file implements it, and
nothing checks the two against each other.

## Decision

Adopt **C**. [workflow.md](../architecture/workflow.md#requirements-plans-and-runs) is
normative for the README shape; `/enjoy-playground` derives one page per screen, assigns
each an address, and presents the map inside the draft it already stops on.

Query-string design — parameter names, defaults, the sort vocabulary — is not this
record's. It is per round rather than per feature and is settled where its round is.

## Revisit triggers

1. **A playground's addresses change after its first page ships.** The append-only cost
   is being paid repeatedly rather than once; re-hear B.
2. **A playground's pages stop being one-per-address** — a wizard inside one route, a
   flow driven by modals. The group line then names something that is not an address and
   the shape has to be re-decided.
3. **Requirement lines start being written about the address itself.** A line such as
   "keeps the filter in the URL so it survives reload" is a behaviour with a test and is
   fine; a line naming a path is the map leaking into the checklist.
