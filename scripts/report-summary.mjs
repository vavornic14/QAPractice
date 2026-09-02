#!/usr/bin/env node
/**
 * Writes a Playwright run summary into the GitHub Actions job summary, so
 * results are readable on the run page without downloading the artifact.
 *
 * Usage: node scripts/report-summary.mjs "<heading>" [expected-outcome]
 *   expected-outcome: "pass" (default) or "fail" - for the regression project,
 *   where failures are the correct result and should not be rendered as alarming.
 *
 * Never fails the job: a missing or malformed report produces a note, not an
 * error. The tests themselves decide whether the job passes.
 */

import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const heading = process.argv[2] ?? 'Test results';
const expect = (process.argv[3] ?? 'pass').toLowerCase();

const junit = join(process.cwd(), 'test-results', 'junit.xml');
const out = process.env.GITHUB_STEP_SUMMARY;

const emit = (md) => {
  if (out) appendFileSync(out, md + '\n');
  console.log(md);
};

if (!existsSync(junit)) {
  emit(`### ${heading}\n\n_No JUnit report found at \`test-results/junit.xml\` - the run may not have started._`);
  process.exit(0);
}

let xml;
try {
  xml = readFileSync(junit, 'utf8');
} catch (e) {
  emit(`### ${heading}\n\n_Could not read the JUnit report: ${e.message}_`);
  process.exit(0);
}

const attr = (name) => {
  const m = xml.match(new RegExp(`<testsuites[^>]*\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
};

const num = (name) => {
  const v = attr(name);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const tests = num('tests');
const failures = num('failures');
const errors = num('errors');
const skipped = num('skipped');
const time = attr('time');
const passed = Math.max(tests - failures - errors - skipped, 0);
const failed = failures + errors;

// For the regression project a failure IS the expected result.
const ok = expect === 'fail' ? failed > 0 && passed === 0 : failed === 0;
const verdict = expect === 'fail'
  ? (ok
      ? 'as expected - these tests encode unfixed bugs and must fail'
      : 'UNEXPECTED - a regression test passed, so a bug was fixed or a test was healed')
  : (ok ? 'all green' : 'failures present');

const rows = [
  `### ${ok ? '✅' : '❌'} ${heading}`,
  '',
  `**${verdict}**`,
  '',
  '| Passed | Failed | Skipped | Total | Duration |',
  '|---:|---:|---:|---:|---:|',
  `| ${passed} | ${failed} | ${skipped} | ${tests} | ${time && Number.isFinite(Number(time)) ? `${Number(time).toFixed(1)}s` : 'n/a'} |`,
];

// Name the failing tests - the summary is far more useful than a bare count.
const failingNames = [...xml.matchAll(/<testcase\b[^>]*\bname="([^"]*)"[^>]*>(?![\s\S]*?<\/testcase>)/g)];
const cases = [...xml.matchAll(/<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g)]
  .filter(([, , body]) => /<(failure|error)\b/.test(body))
  .map(([, attrs]) => (attrs.match(/\bname="([^"]*)"/) ?? [, '(unnamed)'])[1]);

if (cases.length) {
  rows.push('', expect === 'fail' ? '**Failing as intended:**' : '**Failing tests:**', '');
  for (const name of cases.slice(0, 25)) rows.push(`- \`${name}\``);
  if (cases.length > 25) rows.push(`- _...and ${cases.length - 25} more_`);
}

void failingNames;
emit(rows.join('\n'));
