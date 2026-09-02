# Regression tests — DO NOT HEAL

**The tests in this directory are supposed to FAIL.**

They encode three real bugs that are present and unfixed in the application. Their assertions
describe **correct** behaviour, so they fail against the current build and will pass only once the
product is actually fixed.

A red run here is the tests working correctly. It is not a problem to solve.

## The three bugs

| ID | Bug | Expected | Actual |
|---|---|---|---|
| **REG-01** | Saving an unmodified edit destroys data | Description, Importance and Label unchanged | Description erased, Importance → `Low`, Label → `Hobby` |
| **REG-02** | Cancelling an edit completes the task | Completion state untouched | Task becomes complete |
| **REG-03** | Delete removes all tasks sharing a title | Only the clicked task is removed | Every task with that title is removed |

Full write-ups, with reproduction steps, are in [`BUG-REPORT.md`](../../BUG-REPORT.md).

## Rules for this directory

**Do not run the `playwright-test-healer` agent on these files.** The healer's purpose is to make
failing tests pass. Pointed here it would weaken the assertions until they match the buggy
behaviour — the tests would go green, the bugs would still ship, and nothing would report them.

That applies equally to fixing them by hand under time pressure. If one of these fails in CI, that
is the intended signal.

Concretely, do not:

- weaken or delete an assertion so a test passes
- add `test.skip`, `test.fixme` or `test.fail`
- add retries (`retries` is `0` project-wide for this reason)
- delete or rename a test to make a red run go away

## When a bug is genuinely fixed

The regression test should then pass on its own, with **no change to the test**. That is the point:
the test already describes correct behaviour.

1. Fix the bug in `src/`
2. Run `npm run test:regression` — the test should now pass without being edited
3. Move its ID from `MUST_STILL_FAIL` to `FIXED` in
   [`scripts/assert-regressions-fail.mjs`](../../scripts/assert-regressions-fail.mjs)
4. Commit the `src/` fix and the guard change together

If a test only passes after you edited the **test**, the bug is not fixed. Revert it.

## The guard

```bash
npm run test:guard
```

This runs the regression project and **inverts** the result:

| Situation | Guard exit |
|---|---|
| All three still fail | `0` ✅ — bugs still tracked |
| Any one passes | `1` ❌ — either genuinely fixed, or healed |
| A test is missing, renamed or skipped | `1` ❌ |
| The suite is empty | `1` ❌ |

Deleting a test or marking it skipped fails the guard just as loudly as healing it, so there is no
quiet way to make the signal go away.

CI runs this guard on every push. A healed regression test cannot reach `main` unnoticed.
