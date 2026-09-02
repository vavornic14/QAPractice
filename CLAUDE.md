# Project instructions

QA homework project: a deliberately buggy React Task Manager, plus a Playwright suite that
documents its defects.

## Critical rule — the regression tests must stay red

`tests/regression/` contains three tests that are **supposed to fail**. They encode real, unfixed
bugs (REG-01, REG-02, REG-03) and assert *correct* behaviour, so they fail today and will pass only
when the app is fixed.

**Never make these tests pass by changing the tests.**

- Do not run `playwright-test-healer` on `tests/regression/`. Its purpose is to turn red tests
  green; here that would erase the only record of three critical bugs.
- Do not weaken assertions, add `test.skip` / `test.fixme` / `test.fail`, add retries, or delete a
  test to clear a red run.
- If asked to "fix the failing tests", first check whether they are the regression tests. If they
  are, say so rather than complying — they are failing on purpose.

A regression test may only go green because the **product** was fixed in `src/`, with the test
untouched. See `tests/regression/README.md` for that workflow.

`scripts/assert-regressions-fail.mjs` enforces this in CI and treats deleted, renamed and skipped
tests as failures too.

## Test layout

| Directory | Expectation | Healer allowed? |
|---|---|---|
| `tests/e2e/` | Green — 5 user stories over verified-working behaviour | Yes |
| `tests/regression/` | **Red** — 3 known unfixed bugs | **No** |
| `tests/visual/` | Green — 24 property-combination screenshots | Yes, with review |

## Commands

```bash
npm run dev               # app on http://localhost:5173
npm run test:e2e          # user stories, expect green
npm run test:regression   # known bugs, expect RED - that is correct
npm run test:guard        # asserts regression tests are still red
npm run test:visual       # combination screenshots
```

## Working on this repo

- The app in `src/` is intentionally buggy. **Do not fix bugs in `src/` unless explicitly asked** —
  the defects are the subject of the exercise. Fixing one silently turns its regression test green.
- `src/components/TaskManager.tsx` is dead code, never imported. Changes there affect nothing.
- Bugs are documented in `BUG-REPORT.md`; manual scenarios in `MANUAL-TEST-CASES.md`. Update both
  if app behaviour changes.
- Prefer role- and text-based Playwright locators. Note the add form and the inline edit form each
  contain a textarea and two selects, so unscoped locators cause strict-mode violations.
