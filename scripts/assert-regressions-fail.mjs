#!/usr/bin/env node
/**
 * Regression guard.
 *
 * The three tests in tests/regression/ encode real, unfixed bugs. They are
 * SUPPOSED to fail. That creates an obvious hazard: anyone - a person in a
 * hurry, or an AI test healer whose whole job is turning red tests green -
 * can "fix" them by weakening the assertions until they pass. The bug is then
 * still in the product, but nothing reports it any more.
 *
 * This script inverts the normal pass/fail contract for that project:
 *
 *   every regression test still fails  -> exit 0  (correct, bugs still tracked)
 *   any regression test passes         -> exit 1  (either the bug was genuinely
 *                                                  fixed, or the test was healed)
 *
 * Either way a human has to look. A genuine fix is a one-line change here
 * (move the ID to FIXED). A healed test gets caught before it reaches main.
 *
 * Usage:  node scripts/assert-regressions-fail.mjs
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// Resolve Playwright's CLI and run it with the current Node binary. Shelling
// out to `npx` breaks on Windows: Node refuses to spawnSync a .cmd shim
// without `shell: true` (EINVAL), and turning a shell on would invite quoting
// bugs. Invoking the CLI directly sidesteps both and is portable.
const playwrightCli = createRequire(import.meta.url).resolve('@playwright/test/cli');

/** Regression IDs that must still fail. Move an ID to FIXED only when the
 *  underlying product bug is actually fixed in src/. */
const MUST_STILL_FAIL = ['REG-01', 'REG-02', 'REG-03'];

/** Bugs that have been genuinely fixed. Tests for these must now PASS. */
const FIXED = [];

const REPORT_DIR = join(process.cwd(), 'test-results');
const REPORT = join(REPORT_DIR, 'regression-guard.json');

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

console.log(bold('\nRegression guard - the regression tests are expected to FAIL.\n'));

if (existsSync(REPORT)) rmSync(REPORT, { force: true });
mkdirSync(REPORT_DIR, { recursive: true });

const run = spawnSync(
  process.execPath,
  [playwrightCli, 'test', '--project=regression', '--reporter=json'],
  {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: REPORT },
    // Playwright exits non-zero when tests fail, which is the expected case
    // here - so the exit code is deliberately ignored in favour of the report.
  },
);

let report;
try {
  report = JSON.parse(existsSync(REPORT) ? readFileSync(REPORT, 'utf8') : run.stdout);
} catch {
  console.error(red('Could not parse the Playwright JSON report.'));
  console.error(red('The regression project did not run. Treating as failure.'));
  process.exit(1);
}

/** Flatten the nested suite tree into { title, status } rows. */
const results = [];
const walk = (suite) => {
  for (const spec of suite.specs ?? []) {
    const status = spec.tests?.[0]?.results?.[0]?.status ?? 'unknown';
    results.push({ title: spec.title, ok: spec.ok === true, status });
  }
  for (const child of suite.suites ?? []) walk(child);
};
for (const suite of report.suites ?? []) walk(suite);

if (results.length === 0) {
  console.error(red('No regression tests were found or executed.'));
  console.error(red('An empty regression suite silently protects nothing. Failing.'));
  process.exit(1);
}

// Report what actually ran.
console.log(bold('Results:\n'));
for (const r of results) {
  const label = r.ok ? green('PASSED') : red('FAILED');
  console.log(`  ${label}  ${r.title}`);
}
console.log('');

const problems = [];

// 1. Every ID that must still fail has to be present AND failing.
for (const id of MUST_STILL_FAIL) {
  const matches = results.filter((r) => r.title.includes(id));
  if (matches.length === 0) {
    problems.push(`${id} has no test any more - it was deleted, renamed or skipped.`);
    continue;
  }
  for (const m of matches.filter((r) => r.ok)) {
    problems.push(
      `${id} PASSED but is listed as an unfixed bug.\n` +
      `      -> "${m.title}"\n` +
      `      -> If the bug is genuinely fixed in src/, move ${id} into FIXED in this script.\n` +
      `      -> If the test was weakened to make it pass, revert it. Do not heal this test.`,
    );
  }
}

// 2. Anything declared FIXED must now actually pass.
for (const id of FIXED) {
  for (const m of results.filter((r) => r.title.includes(id) && !r.ok)) {
    problems.push(`${id} is listed as FIXED but its test still fails: "${m.title}"`);
  }
}

// 3. Skipped tests defeat the guard just as effectively as deleted ones.
for (const r of results.filter((r) => r.status === 'skipped')) {
  problems.push(`"${r.title}" was SKIPPED. A skipped regression test protects nothing.`);
}

if (problems.length > 0) {
  console.error(red(bold('Regression guard FAILED:\n')));
  for (const p of problems) console.error(red(`  - ${p}`));
  console.error(
    yellow(
      '\nThese tests encode bugs that are still present in the app.\n' +
      'They are meant to be red. A green regression test means either the bug\n' +
      'was fixed (update this script) or the test stopped testing the bug.\n',
    ),
  );
  process.exit(1);
}

console.log(green(bold(`All ${results.length} regression tests still fail, as expected.`)));
console.log(green('No regression test has been healed into passing.\n'));
process.exit(0);
