# ADR 0016: A transitive version still under `minimumReleaseAge` is waited out, and every such stop gets an Issue

- Status: Accepted
- Date: 2026-11-13

## Context

The dependency-update process ([process.md](../../.claude/skills/update-dependencies/process.md))
builds its candidate list from `pnpm outdated`, which applies `minimumReleaseAge` to the
candidate's own version only. A candidate version that has matured can still pin, by exact
version, a transitive dependency that has not. Installing it then stops:

```
ERR_PNPM_NO_MATURE_MATCHING_VERSION  Version 1.65.0 (released 6 days ago) of playwright-core does not meet the minimumReleaseAge constraint
This error happened while installing the dependencies of playwright@1.65.0
```

No lockfile is written and the working tree is unchanged.

This happened on 2026-11-12 (guppy0356/Tolone#78). `playwright` 1.65.0 was published at
18:28Z on 2026-11-05 and had matured. It pins `playwright-core` 1.65.0, which was published
at 20:17Z the same day, an hour and 49 minutes later, and did not mature until 2026-11-12T20:17Z.
The process had no rule for this stop. The run used the closest one, the rule for a
candidate list that cannot be fetched at all (`ERR_PNPM_NO_MATCHING_VERSION`): wait for the
version to mature, and do not use `minimumReleaseAgeExclude`. It waited about 55 minutes,
fetched the candidate list again (unchanged), re-ran the same `pnpm update -r`, and opened no
Issue, because the wait ended inside the same run.

The gap is built into how candidates are chosen, so it will recur. A range update takes
versions that have only just matured. Packages that are released together, with one pinning
the other exactly, are often published minutes to hours apart. Whenever the pinning package
is published first, the next run can stop the same way.

## Options considered

### A — end the run, write the maturity time to an Issue, wait; the same for a person and a bot (chosen)

Undo, write the transitive package, its version, and the time it matures to the
`deps: 実行失敗 <YYYY-MM-DD>` Issue, and start no run before that time. The next run begins
from the pre-update checks.

### B — wait, and skip the Issue when the wait ends inside the same run

This is what the 2026-11-12 run did. Rejected because an automated run cannot wait inside a
run and so always files the Issue, while a person usually can and so would not. The process
had already settled this split for the candidate-list stop ("人が行うときも自動実行と同じ扱いにする").
The skill is written to be driven by a bot later, and a rule whose record depends on who ran
it gives the bot's history a different shape from the person's.

### C — drop the stopped group from this round and take the rest one group at a time

Rejected because the stopped group is usually the large one, and dropping it gains little.
On 2026-11-12 the `playwright` group held 10 of the 13 candidates (vite, vitest, storybook,
the Tailwind Vite plugin and the rest), so 3 would have moved. Each remaining group costs a
full verification of every app, and the dropped group comes back in the next round anyway.
The trade is a wait of hours (1 h 49 min of publish skew in the case above) against that
extra verification work. This one-group-at-a-time path has also never been run for this cause.

### D — list the transitive version in `minimumReleaseAgeExclude`

Rejected. The process allows that exception only for a severity-high advisory whose fix has
not matured, and it already refuses it for the candidate-list stop. Adding an unvetted
transitive version to the exception list to save an hour is exactly what `minimumReleaseAge`
is there to prevent.

## Decision

Adopt **A**. The prerequisites section (前提) of
[process.md](../../.claude/skills/update-dependencies/process.md) carries the rule, next to
its existing statement of `minimumReleaseAge`. The lower-major attempt in the major-update
flow reads the same error code as "this major has no mature version yet". That reading is now
limited to the error naming the package itself.

## Why A over B

- **One rule for both actors.** The candidate-list stop already treats a person and a bot
  the same way. B would make this stop, which looks nearly the same, the one place where they
  differ.
- **The record is the cheap part.** A stop costs one Issue, and the Issue's title already
  carries the date. Without it, the only trace is a PR body that exists only if the run
  eventually succeeds.

What A costs: an Issue that may be resolved within the hour, and a person who could have
finished in one sitting starts again from the pre-update checks once the time has passed.

## Revisit triggers

1. **pnpm checks the maturity of exact-pinned transitive versions when it lists candidates.**
   Either `pnpm outdated` stops offering such a version, or the resolver falls back to the
   newest version whose dependencies are all mature. In both cases the stop no longer
   happens and the rule can be deleted.
2. **The waits stop being hours.** If a stop recurs with a pinned version published days
   after the package that pins it, C's trade changes and dropping the group may be worth its
   verification cost.
