// Pre-commit check for the playground requirement files.
// The shapes it relies on are stated once in
// docs/architecture/workflow.md § Requirements, plans, and runs; ADR 0014 says why.
//
// Over the staged changes, per playground:
//   1. README.md is append-only — a committed line gets exactly two edits: `[ ]` → `[x]`,
//      or its sentence wrapped in `~~…~~ (superseded YYYY-MM-DD)` beside a new line.
//   2. Every `[x]` line under `## Requirements` has a same-named `test("…")` in the
//      playground's *.test.ts(x) files.
//   3. A line is checked off only by a run: one line per commit, the first unchecked line
//      of the committed plan's Scope, staged with the run's last step — and the plan itself
//      does not change in that commit.
//   4. A staged plan.md has the documented shape and quotes README lines verbatim.
//
// READMEs without a `## Requirements` section (older playgrounds' usage notes) are ignored.
// Exit 1 with one message per violation; nothing is committed.

import { execFileSync } from "node:child_process";

// git pathspecs are cwd-relative while `:path` is root-relative; pin one cwd.
process.chdir(execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim());

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const gitOrNull = (...args) => {
  try {
    return git(...args);
  } catch {
    return null;
  }
};
const blob = (spec) => gitOrNull("show", spec); // null when the blob does not exist
const splitLines = (text) => text.split(/\r?\n/);

const DOC = "docs/architecture/workflow.md § Requirements, plans, and runs";
const failures = [];
const fail = (message) => failures.push(message);

// --- what this commit touches, per playground ---------------------------------------

const raw = git("diff", "--cached", "--name-status", "-z").split("\0").filter(Boolean);
const touched = []; // { status: A|M|D, path }
for (let i = 0; i < raw.length; ) {
  const status = raw[i];
  if (status.startsWith("R")) {
    touched.push({ status: "D", path: raw[i + 1] }, { status: "A", path: raw[i + 2] });
    i += 3;
  } else if (status.startsWith("C")) {
    touched.push({ status: "A", path: raw[i + 2] });
    i += 3;
  } else {
    touched.push({ status: status[0], path: raw[i + 1] });
    i += 2;
  }
}

const playgrounds = new Map(); // name → { readme, plan, tests, others }
for (const { status, path } of touched) {
  const m = path.match(/^playgrounds\/([^/]+)\/(.+)$/);
  if (!m) continue;
  const [, name, rest] = m;
  if (!playgrounds.has(name)) playgrounds.set(name, { readme: null, plan: null, tests: false, others: [] });
  const entry = playgrounds.get(name);
  if (rest === "README.md") entry.readme = status;
  else if (rest === "plan.md") entry.plan = status;
  else {
    entry.others.push(rest);
    if (/\.test\.tsx?$/.test(rest)) entry.tests = true;
  }
}
for (const [name, entry] of playgrounds) {
  if (!entry.readme && !entry.plan && !entry.tests) playgrounds.delete(name);
}
if (playgrounds.size === 0) process.exit(0);

// --- README structure ---------------------------------------------------------------

const CHECKBOX = /^(\s*)- \[(.)\] (.*)$/; // indent, mark, rest
const SUPERSEDED = /^~~(.*)~~ \(superseded \d{4}-\d{2}-\d{2}\)$/;

const parseRequirement = (line) => {
  const m = line.match(CHECKBOX);
  if (!m) return null;
  const [, indent, mark, rest] = m;
  const struck = rest.match(SUPERSEDED);
  return { indent, mark, rest, sentence: struck ? struck[1] : rest, struck: Boolean(struck) };
};

// Returns null for a README without `## Requirements` (usage notes) or no README at all.
const parseReadme = (text) => {
  if (text === null) return null;
  const lines = splitLines(text);
  if (!lines.some((line) => /^## Requirements\s*$/.test(line))) return null;
  const entries = [];
  const byKey = new Map();
  let section = null;
  let group = null;
  let inFence = false;
  for (const line of lines) {
    if (/^(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^## /.test(line)) {
      section = line.slice(3).trim();
      group = null;
      continue;
    }
    if (section !== "Requirements") continue;
    const top = line.match(/^- (?!\[)(.+)$/);
    if (top) {
      group = top[1].trim();
      continue;
    }
    const requirement = parseRequirement(line);
    if (!requirement) continue;
    const entry = { ...requirement, group, key: `${group} — ${requirement.sentence}`, line };
    entries.push(entry);
    byKey.set(entry.key, entry);
  }
  return { entries, byKey };
};

// --- plan structure -----------------------------------------------------------------

const parsePlan = (text) => {
  const lines = splitLines(text);
  const problems = [];
  const scope = [];
  const contract = [];
  const onPurpose = [];
  if (!/^# Plan — .+/.test(lines[0] ?? "")) problems.push("line 1 must be `# Plan — <short title of this round>`");
  let section = null;
  for (const line of lines.slice(1)) {
    if (/^## /.test(line)) {
      section = line.trim();
      continue;
    }
    if (!line.trim()) continue;
    if (section === "## Scope (in this order)") {
      const m = line.match(/^\d+\.\s+(.*)$/);
      if (m) scope.push(m[1].trim());
      else problems.push(`Scope line is not \`N. <group line> — <requirement line>\`: ${line}`);
    } else if (section === "## Contract") {
      if (/^- /.test(line)) contract.push(line.slice(2).trim());
      else problems.push(`Contract line is not a bullet: ${line}`);
    } else if (section === "## On purpose") {
      if (/^- /.test(line)) onPurpose.push(line.slice(2).trim());
      else problems.push(`On purpose line is not a bullet: ${line}`);
    } else {
      problems.push(
        `unexpected line outside \`## Scope (in this order)\` / \`## Contract\` / \`## On purpose\`: ${line}`,
      );
    }
  }
  if (!lines.includes("## Scope (in this order)")) problems.push("missing `## Scope (in this order)`");
  else if (scope.length === 0) problems.push("`## Scope (in this order)` lists no requirement");
  if (!lines.includes("## Contract")) problems.push("missing `## Contract`");
  else if (contract.length === 0) problems.push("`## Contract` needs at least `- (none)`");
  for (const item of contract) {
    if (item !== "(none)" && !/^[^:\s][^:]{0,40}: \S/.test(item)) {
      problems.push(`Contract line must start with the page or path it scopes (\`- /my/loans: …\`) or be \`- (none)\`: - ${item}`);
    }
  }
  if (!lines.includes("## On purpose")) problems.push("missing `## On purpose`");
  else if (onPurpose.length === 0) problems.push("`## On purpose` needs at least `- (none)`");
  for (const item of onPurpose) {
    if (item !== "(none)" && !/^[^:\s][^:]{0,40}: \S/.test(item)) {
      problems.push(`On purpose line must start with the page it scopes (\`- MyLoans: …\`) or be \`- (none)\`: - ${item}`);
    }
  }
  return { scope, contract, onPurpose, problems };
};

const PLAN_SHAPE = [
  "  Expected shape:",
  "    # Plan — <short title>",
  "",
  "    ## Scope (in this order)",
  "",
  "    1. <group line> — <requirement line>",
  "",
  "    ## Contract",
  "",
  "    - <page or path>: <choice>   (or `- (none)`)",
  "",
  "    ## On purpose",
  "",
  "    - <Page>: <statement>   (or `- (none)`)",
].join("\n");

// --- test names ---------------------------------------------------------------------

// One `git grep` per playground: every test("…") name in its staged *.test.ts(x) files.
const TEST_NAME = /\btest\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const testNamesOf = (name) => {
  const source =
    gitOrNull("grep", "--cached", "-h", "-I", "-e", "", "--", `playgrounds/${name}/*.test.ts`, `playgrounds/${name}/*.test.tsx`) ?? "";
  const names = new Set();
  for (const m of stripComments(source).matchAll(TEST_NAME)) names.add(m[2].replace(/\\(.)/g, "$1"));
  return names;
};

// --- the checks ---------------------------------------------------------------------

for (const [name, entry] of playgrounds) {
  const readmePath = `playgrounds/${name}/README.md`;
  const planPath = `playgrounds/${name}/plan.md`;
  const before = parseReadme(blob(`HEAD:${readmePath}`));
  const after = parseReadme(blob(`:${readmePath}`));

  // A retired playground: README deleted and nothing left under it.
  if (entry.readme === "D") {
    const remaining = gitOrNull("ls-files", "--cached", "-z", "--", `playgrounds/${name}/`) ?? "";
    if (remaining.split("\0").filter(Boolean).length === 0) continue;
    if (before !== null) {
      fail(`${readmePath}: deleted while the playground stays — README.md is the requirement history. Restore it.`);
    }
    continue;
  }

  if (before === null && after === null) continue; // usage notes (pre-ADR 0014), or no README at all
  if (before !== null && after === null) {
    fail(`${readmePath}: \`## Requirements\` was removed — the section, like the file, is append-only. Restore it.`);
    continue;
  }

  // 1. append-only, over the whole file, from the staged diff
  if (entry.readme && before !== null) {
    const diff = git("diff", "--cached", "-U0", "--", readmePath);
    for (const hunk of diff.split(/^@@.*$/m).slice(1)) {
      // the ---/+++ headers precede the first @@, so every -/+ line here is content
      const removed = [];
      const added = [];
      for (const line of splitLines(hunk)) {
        if (line.startsWith("-")) removed.push(line.slice(1));
        else if (line.startsWith("+")) added.push(line.slice(1));
      }
      for (const line of removed) {
        const index = added.findIndex((candidate) => allowedEdit(line, candidate));
        if (index === -1) {
          fail(
            `${readmePath}: this committed line was edited, moved or removed, but README.md is append-only:\n` +
              `    ${line}\n` +
              `  Restore it exactly. A committed line takes only two edits, ever:\n` +
              `    - check it off:  \`- [ ] …\` → \`- [x] …\`  (done by /implement, together with its same-named test)\n` +
              `    - replace it:    \`- [ ] …\` → \`- [ ] ~~…~~ (superseded YYYY-MM-DD)\` plus a new \`- [ ]\` line (done by /plan)\n` +
              `  Any other change — rewording, indent, order, deletion — is a new line, not an edit.`,
          );
          continue;
        }
        added.splice(index, 1);
      }
    }
  }

  // Structural view of what changed under ## Requirements.
  const flips = [];
  for (const now of after.entries) {
    const was = before?.byKey.get(now.key);
    if (was && was.mark === " " && !was.struck && now.mark === "x" && !now.struck) flips.push(now);
    if (was && !was.struck && now.struck) {
      const replacement = after.entries.find(
        (e) => e.group === now.group && e.mark === " " && !e.struck && !before.byKey.has(e.key),
      );
      if (!replacement) {
        fail(
          `${readmePath}: "${now.sentence}" was struck through, but no new \`- [ ]\` line under \`- ${now.group}\` replaces it in this commit.\n` +
            `  A line is superseded only when a newer line replaces it — add the replacement under the same group, or leave the line as it was.`,
        );
      }
    }
  }

  // 2. every [x] line has a same-named test
  if (entry.readme || entry.tests) {
    const names = testNamesOf(name);
    for (const now of after.entries) {
      if (now.group === null) {
        fail(`${readmePath}: this requirement line is not under a group bullet (\`- /…\`):\n    ${now.line.trim()}`);
        continue;
      }
      if (now.mark !== " " && now.mark !== "x") {
        fail(`${readmePath}: checkbox mark "[${now.mark}]" is not "[ ]" or "[x]":\n    ${now.line.trim()}`);
        continue;
      }
      if (now.mark === "x" && !now.struck && !names.has(now.sentence)) {
        fail(
          `${readmePath}: this line is checked, but no test in playgrounds/${name}/ is named by it:\n` +
            `    ${now.line.trim()}\n` +
            `  A \`[x]\` is a receipt for \`test("${now.sentence}", …)\` in a *.test.ts(x) file — the string must be identical.\n` +
            `  Add or restore that test (if this commit renames or deletes it, keep its name), or leave the line \`- [ ]\`.\n` +
            `  Only a superseded line (\`~~…~~\`) may lose its test.`,
        );
      }
    }
  }

  // 3. a check-off is a run: one line, the first in the committed plan's Scope, with the last step
  if (flips.length > 0) {
    if (flips.length > 1) {
      fail(
        `${readmePath}: ${flips.length} lines were checked off in one commit:\n` +
          flips.map((f) => `    ${f.line.trim()}`).join("\n") +
          `\n  One run of /implement ${name} delivers one requirement and checks off one line. Commit them one run at a time.`,
      );
    }
    if (entry.plan) {
      fail(
        `${planPath} changes in the same commit that checks a line off in ${readmePath}.\n` +
          `  The plan is approved by its own commit before the run starts: commit plan.md alone (via /plan ${name}), then run /implement ${name}.`,
      );
    }
    if (entry.others.length === 0) {
      fail(
        `${readmePath}: a line is checked off but nothing else under playgrounds/${name}/ is staged.\n` +
          `  The flip rides on the run's last step — stage it with the commit that finishes the requirement (its test, the page, the route), never on its own.`,
      );
    }
    const headPlan = blob(`HEAD:${planPath}`);
    if (headPlan === null) {
      for (const f of flips) {
        fail(
          `${readmePath}: "${f.sentence}" (under \`- ${f.group}\`) was checked off, but there is no committed ${planPath}.\n` +
            `  A line is checked off only by a run of /implement ${name}, which starts from a plan the user has committed:\n` +
            `  run /plan ${name}, commit plan.md on its own, then /implement. Not running a plan? Leave the line \`- [ ]\`.`,
        );
      }
    } else {
      const { scope } = parsePlan(headPlan);
      const expected = scope.find((key) => {
        const e = before?.byKey.get(key);
        return e && e.mark === " " && !e.struck;
      });
      for (const f of flips) {
        if (!scope.includes(f.key)) {
          fail(
            `${readmePath}: "${f.sentence}" (under \`- ${f.group}\`) was checked off, but ${planPath} § Scope does not list \`${f.key}\`.\n` +
              `  Only lines in the committed plan's Scope get checked off. Run /plan ${name} to bring it into scope, or leave the line \`- [ ]\`.`,
          );
        } else if (expected && expected !== f.key) {
          fail(
            `${readmePath}: "${f.sentence}" was checked off, but the first unchecked line of ${planPath} § Scope is \`${expected}\`.\n` +
              `  /implement walks the Scope in order; finish that line first, or run /plan ${name} to reorder.`,
          );
        }
      }
    }
  }

  // 4. a staged plan.md has the documented shape and quotes README lines verbatim
  if (entry.plan === "A" || entry.plan === "M") {
    const { scope, problems } = parsePlan(blob(`:${planPath}`) ?? "");
    for (const key of scope) {
      const e = after.byKey.get(key);
      if (!e) problems.push(`Scope line matches no README line character-for-character: ${key}`);
      else if (e.struck) problems.push(`Scope line is superseded in the README: ${key}`);
      else if (e.mark === "x") problems.push(`Scope line is already checked off in the README: ${key}`);
    }
    if (problems.length > 0) {
      fail(`${planPath}: not in the shape ${DOC} gives:\n` + problems.map((p) => `    - ${p}`).join("\n") + `\n${PLAN_SHAPE}`);
    }
  }
}

// Is `added` an allowed rewrite of `removed`? (check 1)
function allowedEdit(removed, added) {
  if (removed === added) return true; // e.g. a missing trailing newline gained
  const before = parseRequirement(removed);
  const after = parseRequirement(added);
  if (!before || !after || before.indent !== after.indent) return false;
  if (before.mark === " " && after.mark === "x" && before.rest === after.rest && !before.struck) return true;
  if (before.mark === after.mark && !before.struck && after.struck && after.sentence === before.rest) return true;
  return false;
}

// --- report -------------------------------------------------------------------------

if (failures.length > 0) {
  console.error(`check-playground-readme: the staged changes break the requirement-file rules (${DOC}).`);
  console.error("Nothing was committed.\n");
  for (const message of failures) console.error(`  ✗ ${message}\n`);
  process.exit(1);
}
