---
name: enjoy-playground
description: Start a new playground from a plain-language description — scaffolds it and writes its README.md requirement checklist. Does not design, plan, or implement; follow with /plan.
argument-hint: <what you want to build, in your own words>
disable-model-invocation: true
allowed-tools: Bash(ls:*)
---

# /enjoy-playground

Turns a description into a new playground with its requirements written down. It does
not design, plan, or implement anything. What it writes is defined once in
[workflow.md § Requirements, plans, and runs](../../../docs/architecture/workflow.md#requirements-plans-and-runs);
read that section before the first run. Paths below are relative to the repository root.

Existing playgrounds: !`ls "${CLAUDE_PROJECT_DIR}/playgrounds"`

## Input

`$ARGUMENTS` — the description, in the user's own words (any language): the service in a
sentence, then the endpoints or screens wanted and what each shows. If it is empty, ask for
the description and stop — do not name or scaffold anything.

## Steps

1. **Name it.** Derive a short kebab-case English name (`book-loans`, `incident-board`);
   if the description names one, use that. Check at run time — `test -e
   playgrounds/<name>` — not the list above; if it exists, stop and ask for another name.
   Nothing is written in this step.
2. **Draft the README in the reply — not on disk.** In English:
   - `# <Title>` and one sentence saying what the service is.
   - `## Requirements` — exactly the shape workflow.md gives: one top-level
     `- <endpoint or screen, as the user named it>` per group, in the order given;
     beneath it, indented two spaces, one `  - [ ] <behaviour>` line per requirement. No
     headings, no bold, no blank lines inside a group. Each behaviour is a single line
     phrased as the sentence that becomes its test name, split as workflow.md says — one
     fixture, one line.
   - `## Decisions` — the heading only.

   Translate what the user said; do not add requirements they did not state. When the
   description leaves a behaviour ambiguous, ask before writing it down. For
   "本の貸し出しサービス。GET /books 蔵書の一覧。GET /my/loans 借りている本の一覧で、タイトル・借りた日・返却期限・期限切れかが見える"
   the requirements are:

   ```markdown
   - GET /books
     - [ ] shows the catalogue
   - GET /my/loans
     - [ ] shows my loans
     - [ ] shows each loan's title, borrowed date and due date
     - [ ] marks a loan as overdue when the due date has passed
   ```

3. **Ask the user to compare the draft with what they typed, and stop until they
   approve.** A rejected draft leaves the tree clean.
4. **Scaffold.** `pnpm -w new:playground <name>` (the `-w` runs the root script from any
   cwd). It writes `playgrounds/<name>/` — the Vite / Vitest / Storybook / MSW base, a
   placeholder `indexRoute` in `src/root.route.tsx`, a starter
   `src/features/welcome/Welcome.stories.tsx` — appends `playgrounds/<name>/public` to
   `msw.workerDirectory` in the root `package.json`, and runs `pnpm install`, which
   rewrites `pnpm-lock.yaml` and writes the tracked `public/mockServiceWorker.js`. It
   writes neither `README.md` nor `src/openapi.yaml`, and its `generate:api` script is
   the pre-ADR-0013 one — `/implement`'s first run replaces it per
   [setup.md](../../../docs/architecture/setup.md#what-the-scaffold-leaves-for-you).
5. **Write `playgrounds/<name>/README.md`** with the approved text.
6. **Hand over the first commit.** Run `git status --short`; the only entries must be
   ` M package.json`, ` M pnpm-lock.yaml` and `?? playgrounds/<name>/` — anything else
   means the tree was not clean: stop and report. Then tell the user what to stage and
   the message, and stop without committing:
   `git add playgrounds/<name> package.json pnpm-lock.yaml` (never `-A`, `-u` or `.`),
   then `git commit -m "Scaffold <name> with its first requirements"`. Their commit
   starts the playground — they run it, or tell you to run exactly that.
7. End with one line: `Created <name>. Commit it, then /plan <name>`.
