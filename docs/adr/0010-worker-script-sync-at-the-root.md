# ADR 0010: The worker scripts are synced by the root project's own postinstall

- Status: Accepted
- Date: 2026-08-09

## Context

Every playground commits `public/mockServiceWorker.js`, and `scripts/new-playground.mjs`
produces it by running `msw init public --save` at scaffold time. `--save` writes an
`msw.workerDirectory` field into that playground's `package.json`, which MSW documents as
the thing that keeps the script current: *"whenever you install the `msw` package, the
worker script will be copied to the `msw.workerDirectory` destination automatically."*

It has never fired. Eleven of the thirteen worker scripts no longer match the installed
msw, and each carries the version that was current on the day its playground was created —
2.12.13 in March, 2.14.3 in May, 2.15.0 in July. The file freezes at birth.

MSW's postinstall resolves its target from `INIT_CWD`, which pnpm does not give dependency
lifecycle scripts. `path.resolve(undefined, …)` throws `The "paths[0]" argument must be of
type string`, MSW's own `.catch(() => void 0)` discards it, and the hook fails silently on
every install — which is why nobody noticed for five months. Neither a plain install, a
forced one, a rebuild, nor a real change of the msw version moves any of the thirteen,
while supplying `INIT_CWD` by hand copies them all correctly. Nothing is wrong with MSW's
copier, only with what triggers it, and the documented mechanism is unavailable at every
level including the root.

Nothing is broken today. MSW's client accepts any worker script within the same major, so
2.x against 2.15.0 works and only warns.

## Options considered

### A — the root project lists the paths and syncs them from its own postinstall (chosen)

The root `package.json` carries `msw.workerDirectory` as the one list of destinations, and
its own `postinstall` runs `scripts/sync-msw-worker.mjs`, which copies the installed msw's
worker script to each path. A root lifecycle script is the project's own, so it runs on
`pnpm install` without depending on `INIT_CWD`. The per-playground fields are removed, and
the scaffold appends to the root list instead of running `msw init --save`.

### B — keep the per-playground fields; add `msw init` to the update-dependencies skill

Rejected: the fields already exist and already do nothing, which is the failure being
fixed — a setting that reads as live and is inert. Moving the work into a checklist keeps
the inert setting *and* adds a step that fires a few times a year. That skill states it
will later drive an automated bot, and "remember to regenerate the worker" is the first
thing such a bot loses.

### C — stop committing the script; generate it before dev, test and build

Rejected: the file has to exist before any server starts, so `dev`, `test`, `preview` and
`build-storybook` each grow a pre-step, and a miss surfaces in the browser at runtime
rather than at the command line. Committing it keeps a stale worker visible in review.

## Decision

Adopt **A**. [docs/architecture/mocking.md](../architecture/mocking.md#the-worker-script)
carries the normative rule; the guide had said nothing about the worker script at all, so
the rule lands there for the first time.

## Why A over B

- **An inert setting is worse than no setting.** Thirteen playgrounds were configured the
  way MSW's own documentation prescribes, drifted anyway, and nobody looked — because the
  configuration read as handled.
- **A silent skip is the bug, not the stale file.** `scripts/sync-msw-worker.mjs` prints
  which playgrounds it rewrote, and warns on stderr when it cannot resolve msw, precisely
  where MSW's hook returns quietly.
- **The version is not a judgement call.** There is exactly one right answer, the installed
  msw, so it should not be decided per bump.

What A costs: a copy step this repo maintains instead of one its dependency provides, and a
root `package.json` that names playground paths, so a new playground is registered in two
places. A bump to msw now also rewrites up to thirteen worker scripts into the same commit.

## Revisit triggers

1. **pnpm starts passing `INIT_CWD` to dependency lifecycle scripts, or MSW stops needing
   it.** The dependency's own hook becomes the trigger again and the script is deletable.
2. **A real backend arrives and the mock layer goes away** — the same trigger as
   [ADR 0009](./0009-two-msw-worker-instances.md), and this question disappears with it.
3. **The worker script stops being a per-playground file** — pulled into a shared package,
   or served rather than committed. The path list has nothing left to enumerate.
