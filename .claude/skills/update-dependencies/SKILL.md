---
name: update-dependencies
description: Update npm dependencies in this monorepo. Use when checking for outdated packages, bumping a package version, investigating release notes for an upgrade, or running `pnpm outdated`.
---

# Updating Dependencies

Every bump — patch, minor, or major — is investigated against its release notes before execution. The workflow is deliberately strict so the decisions are reproducible: today they are made by hand, but the same rules will later drive an automated bot (PR creation, auto-merge for safe bumps, human discussion for impactful ones). Follow the steps exactly even for trivial patches.

## 1. Collect outdated packages

```bash
pnpm outdated -r                     # human-readable table
pnpm outdated -r --format list       # machine-readable, includes Dependents
```

Group entries by SemVer step (patch, minor, major). Process the groups in order: **patch → minor → major**. Within a group, every candidate is investigated (step 2) before any execution (step 4).

Packages released as a unit (same version across the catalog) form a single candidate:

- `tailwindcss` + `@tailwindcss/vite`
- `storybook` + `@storybook/addon-vitest` + `@storybook/react-vite`
- `vitest` + `@vitest/browser` + `@vitest/browser-playwright`
- `react` + `react-dom`

For a non-catalog candidate, enumerate its specs before treating it as one edit:

```bash
grep -h '"<package>":' playgrounds/*/package.json packages/*/package.json | sort | uniq -c
```

`pnpm outdated` reports the version a spec **resolved to**, not the spec, so a candidate can carry several — `@types/react` was `^19.2.14` in four playgrounds and `^19.2.17` in nine, all resolving to 19.2.17, and `vite` was `^8.0.10` in one and `^8.1.5` in twelve. All of them move together. Bumping only the specs that match the reported version splits the package across two resolved versions, and for anything other packages take as a *peer* — `storybook`, `react`, `vitest` — pnpm keys a separate instance per peer version. Two instances of one library fail at runtime rather than at typecheck: one patches `HTMLElement.focus` while a story calls the other's, and every `userEvent` call dies with `Illegal invocation`.

## 2. Investigate each candidate

For each candidate in the current group:

```bash
# A. Bump the version in pnpm-workspace.yaml (catalog) or per playground/package.json (non-catalog)
# B. Dry-run the install — writes pnpm-lock.yaml but skips node_modules:
pnpm install --lockfile-only

# C. Enumerate transitive bumps from the lockfile diff:
git diff pnpm-lock.yaml

# D. Revert before moving to the next candidate:
git checkout pnpm-workspace.yaml pnpm-lock.yaml  # adjust paths for per-package edits
```

Read the release notes for **every package that appears in the lockfile diff** (direct + transitive), covering **every intermediate version**. Example: `msw 2.14.3 → 2.14.6` requires reading 2.14.4, 2.14.5, and 2.14.6.

Classify the candidate:

- **No impact** — every release note describes only bug fixes, internal refactors, or features in APIs this repo does not use. No change to options/exports/behaviors touched by `vite.config.ts`, `vitest.config.ts`, `src/lib/api-client.ts`, the feature layers, MSW handlers, or Storybook config. No peer dep change that conflicts with our other deps.
- **Impact** — any release note describes a renamed/removed option, changed default behavior, peer dep shift, or new requirement that touches our code. When unsure, treat as impact.

If a package release page does not exist or is empty ("various fixes" with no detail), check the package's `CHANGELOG.md` or commit log. If still indeterminate, classify as impact.

## 3. Present the impact assessment

For the current group, present a table and wait for explicit confirmation:

```markdown
## Impact assessment — patch group

| Package | Current → Latest | Transitive bumps | Release notes summary | Affects our code? | Plan / done criteria |
|---|---|---|---|---|---|
| msw | 2.14.3 → 2.14.6 | 0 | Bug fixes only — [2.14.6](...), [2.14.5](...), [2.14.4](...) | No | — |
| react + react-dom | 19.2.5 → 19.2.6 | scheduler 0.27.x → 0.27.y | Internal scheduler fix — [link] | No | — |
| vite | 8.0.10 → 8.0.13 | rolldown rc.16 → rc.18, esbuild 0.24.0 → 0.24.2 | `optimizeDeps.entries` default changed — [link] | Yes | Add explicit `entries` to `vite.config.ts`; `pnpm dev` must serve `/api` after restart |
```

Order rows by **ascending transitive bump count** (fewest dependents shifting → smallest blast radius first). Ties are broken by **no-impact first**.

For every "impact" entry, both **Plan** (what code change is required) and **done criteria** (how to verify it works beyond `pnpm test` + `pnpm -r build`) must be filled in before execution.

## 4. Execute one candidate at a time

Apply the candidates in the order presented in step 3. For each:

### a. Where to edit the version

- **Catalog package** (in `pnpm-workspace.yaml`): edit the catalog, then `pnpm install` at the repo root.
- **Non-catalog** (e.g. `vite`, `react-hook-form`): edit every spec enumerated in step 1, then `pnpm install` at the repo root.

Edit the specs rather than reaching for `pnpm update <package> --latest -r`. That command re-resolves floating ranges it was not asked about: run for `vite`, it also moved `undici` and three `@csstools` packages, which belong in whatever commit does move them.

To check the catalog: `grep <package> pnpm-workspace.yaml`. To check dependents for a non-catalog package: see `Dependents:` in `pnpm outdated -r --format list`.

### b. Verify

Both must pass before committing:

```bash
pnpm test       # Vitest unit tests (Storybook play functions, browser mode)
pnpm -r build   # Production build (also runs tsc via vite-plugin-checker)
```

Confirm the bump landed as one version, since a spec left behind in step 1 surfaces here rather than in the test output:

```bash
grep -oE "<package>@[0-9][0-9.]*" pnpm-lock.yaml | sort -u   # one line
```

Count lockfile keys, not directories — `node_modules/.pnpm` keeps orphaned directories from earlier installs, and an unreferenced one looks exactly like a second instance.

For "impact" candidates, additionally execute the **done criteria** declared in step 3.

If a "no-impact" candidate fails verification, reclassify as impact: roll back the bump, write a plan, and re-present.

### c. Commit

One commit per candidate (single package or bundled group). Subject: `Bump <package> to <version>` (or `Bump <group> to <version>` for bundles).

## 5. Fallback for post-install bins: use `--filter`

`pnpm exec <bin>` at the repo root can resolve to the wrong binary (or fail) when the bin is not a direct dep of the root `package.json`. Re-run inside a playground via `--filter`.

Example — Playwright browser re-download after a `playwright` bump:

```bash
# At the repo root: may not download the new browser version
pnpm exec playwright install

# Via a playground: uses that playground's playwright binary, downloads correctly
pnpm --filter @tolone/blog exec playwright install chromium chromium-headless-shell
```

This pattern applies to any post-install step that depends on the package's bin.

## Known gap

MSW intercepts at the fetch level, so unit tests do not exercise `ky` directly. A `ky` update that changes HTTP behavior will pass tests but may break the dev server. For `ky` updates, add `pnpm dev` smoke-test as an explicit done criterion in step 3.
