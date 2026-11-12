# ADR 0017: `pnpm install` installs the Chromium that the installed Playwright expects

- Status: Accepted
- Date: 2026-11-13

## Context

Tests run in Playwright Chromium ([ADR 0008](./0008-browser-mode-not-jsdom.md)), and each
Playwright version pins its own browser build. The browser is not an npm package, so
`pnpm install` does not fetch it. Until now the README asked for
`pnpm exec playwright install chromium` "once per machine", and ADR 0008 counted that one-off
step among its costs.

"Once" is wrong. On 2026-11-12 the range update (guppy0356/Tolone#78) moved `playwright`
from 1.64.1 to 1.65.0, and Chromium moved with it to Chrome for Testing 158.0.8127.18.
Until someone runs the install command again, tests fail at browser launch. That applies to
the person doing the update and to everyone who pulls the merge. The PR carried the command
as a note to read first.

The README's command has a second problem. The root project did not depend on Playwright,
so `pnpm exec playwright` at the root fell through to whatever `playwright` was first on
`PATH`. On the machine where this was checked, that was a Python install at 1.59.0, which
installs a different browser build. The command that worked was
`pnpm --filter ./playgrounds/<app> exec playwright install chromium`.

## Options considered

### A — the root depends on `playwright` through the catalog, and its `postinstall` runs `playwright install chromium` (chosen)

The root `package.json` gains `"playwright": "catalog:"`, the same entry every playground
has, and its `postinstall` runs `playwright install chromium` after the MSW worker sync. Root
lifecycle scripts see the root's own `node_modules/.bin`, so the CLI is the workspace's
Playwright. The install is a no-op when the build is already present (about one second),
and it downloads only when the version has changed.

### B — run the install in the dependency-update verification, every time

Rejected because it fixes only the machine that runs the update. Everyone who pulls the
merge still needs the PR-body note. It is also the shape
[ADR 0010](./0010-worker-script-sync-at-the-root.md) already rejected for the MSW worker:
a step in the update skill that has to be remembered, when the project's own install can
do the work.

### C — run it in the verification only when Playwright's resolved version changed

Rejected for B's reason, plus one more. Deciding whether to run adds a check, and it does
not help a machine whose browser was already out of date before the update started.

### D — keep it out of every procedure; write a PR-body note when Playwright moves

This is what happened on 2026-11-12. Rejected because it depends on the updater noticing,
and the README's "once per machine" tells every reader there is nothing to notice.

### A′ — resolve Playwright from a playground in a script, as the MSW sync does

Rejected in favour of A's root dependency. A script has to pick a playground to resolve from
and handle the case where that playground has gone, which adds code that the catalog entry
does not need. It also leaves `pnpm exec playwright` at the root resolving to whatever is
on `PATH`.

## Decision

Adopt **A**. The root [package.json](../../package.json) carries the rule. The
[README](../../README.md#setup) states it for people, and
[testing/overview.md](../architecture/testing/overview.md#browser-mode-caveats) links here.
The dependency-update process needs no step of its own. Its verification runs
`pnpm install --frozen-lockfile` before any test, and that install runs the root
`postinstall`.

## Why A over B

- **The browser follows the lockfile wherever the lockfile goes.** Anyone who installs the
  new lockfile gets the matching browser, so pulling the merge is enough and no note is
  needed.
- **Same reasoning as ADR 0010.** A root lifecycle script is the project's own, and the
  version to install has exactly one right answer, the installed Playwright.

What A costs: every `pnpm install` makes one extra call, which takes about a second. The
first install after a version change downloads the browser and fails if it cannot. That
download is Chrome for Testing, its headless shell and FFmpeg: about 600 MB on disk, and
22 seconds when it was checked. The root
also gains one dependency, which the update process covers like the root's other catalog
entry. The root follows the catalog, and the update process keeps the catalog newer than any
playground it leaves behind. So a single playground left on an older Playwright gets no
browser from this install, and its tests fail at launch on a machine that never had that
build.

Note: a `pnpm update` that changed nothing did not run the root `postinstall` when checked.
`pnpm install`, with or without `--frozen-lockfile`, did.

## Revisit triggers

1. **Playwright, or the Vitest browser provider, starts fetching its browser on install.**
   The `postinstall` call becomes redundant and can be removed.
2. **Tests stop running in Playwright**, for example if ADR 0008 is revisited. The
   dependency and the call go with it.
3. **A playground is left behind on an older Playwright.** The root's install no longer
   covers it. Install once per distinct Playwright version, resolved from the playgrounds,
   instead of once from the root.
4. **An install environment must not download browsers**, for example a CI job that only
   typechecks. Give it an opt-out there rather than removing the call for everyone.
