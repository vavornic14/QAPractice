---
name: run-qapractice
description: Build, run, and drive the QAPractice Task Manager app. Use when asked to start the app, run the dev server, take a screenshot of the UI, interact with the running app, reproduce a bug, or run the Playwright e2e, regression or visual tests.
---

A React 18 + Vite + Tailwind Task Manager (single page, no backend, state in
`localStorage`). Drive it programmatically with
`.claude/skills/run-qapractice/driver.mjs` — a Playwright harness that starts
the dev server if needed, executes UI commands, dumps state as JSON and takes
screenshots. **Use the driver, not `npm run dev`** — the human path just opens
a browser window you cannot touch.

All paths below are relative to the repo root.

> **The app is intentionally buggy.** It is QA-homework material: 21 documented
> defects (`BUG-REPORT.md`). Do **not** "fix" `src/` unless explicitly asked —
> the bugs are the subject of the exercise and three of them are pinned by
> regression tests that are supposed to fail.

## Prerequisites

Windows (verified on Windows 11 / MINGW64) or Linux. No system packages were
needed — Playwright's bundled Chromium is the only browser dependency.

```bash
node -v      # v24.19.0 used here; Vite 5 needs >= 18
npm -v       # 11.17.0
```

## Setup

```bash
npm install
npx playwright install chromium
```

## Run (agent path) — the driver

Three modes. Each one starts Vite automatically if port 5173 is not already
serving, and kills it again on exit.

**Smoke test** — one real user flow (add → toggle → filter → delete) with
assertions and three screenshots. Exits non-zero if any check fails.

```bash
node .claude/skills/run-qapractice/driver.mjs smoke
```

Verified output ends with `smoke: all checks passed`; takes ~7s from cold.

**One-shot commands** — each argument is one command, run in order:

```bash
node .claude/skills/run-qapractice/driver.mjs run "clear" "add Buy milk|Two litres|High|Home" "state" "shot after-add"
```

**REPL** — pipe commands on stdin, one per line:

```bash
printf 'clear\nadd Keep me|My description|High|Social\nedit Keep me\nstate\ncancel\nstate\n' \
  | node .claude/skills/run-qapractice/driver.mjs repl
```

### Commands

| Command | Effect |
|---|---|
| `clear` | Reset `localStorage` and reload. **Always run this first.** |
| `add T\|desc\|Importance\|Label` | Fill the add form and submit. Only `T` is required; `Importance` ∈ Low/Medium/High, `Label` ∈ Work/Social/Home/Hobby |
| `complete <title>` | Click that card's Complete/Uncomplete toggle |
| `delete <title>` | Click Delete on the first card with that title |
| `edit <title>` | Open that card's inline edit form |
| `save` / `cancel` | Click Save / Cancel in the open edit form |
| `filter <All\|Work\|Social\|Home\|Hobby>` | Label filter dropdown |
| `sort <asc\|desc>` | Importance sort dropdown |
| `state` | Dump every card as JSON |
| `count` | Number of cards |
| `shot <name>` | Screenshot → `.driver-shots/<name>.png` (full page, gitignored) |
| `eval <js>` | Run JS in the page, print the result |
| `reload` | Reload the page |

`state` returns one object per card:

```json
{ "title": "Buy milk", "description": "Two litres", "importance": "High",
  "label": "Home", "completed": false, "bg": "rgb(255, 255, 255)" }
```

A card **in edit mode** reports the live form values instead — `editing: true`,
`titleField`, `descriptionField`, `importanceShown`, `labelShown`.

Env vars: `HEADED=1` to watch the browser, `APP_URL=` to point at another host.

## Run (human path)

```bash
npm run dev     # http://localhost:5173, Ctrl-C to stop
```

Only useful if you can see a screen. Prefer the driver.

## Test

All four commands below were run and produced exactly these results.

```bash
npm run test:e2e          # 5 passed  (~4s)
npm run test:visual       # 24 passed (~8s) -> screenshots/visual/*.png
npm run test:regression   # 3 FAILED  - correct, see below
npm run test:guard        # exit 0    - "All 3 regression tests still fail"
npm test                  # e2e + visual (excludes regression)
```

| Command | Expected | Meaning |
|---|---|---|
| `test:e2e` | 5 passed | User stories US-01..US-05 |
| `test:visual` | 24 passed | One test per Importance x Label x Completeness combination, each writing `screenshots/visual/combo-NN-*.png` |
| `test:regression` | **3 failed** | REG-01/02/03 encode unfixed bugs. **Red is the correct result** — a green run means a bug was fixed or a test was healed |
| `test:guard` | exit 0 | Inverts the above: passes only while all three still fail. Exits 1 if any passes, is skipped, renamed or deleted |

`npx playwright test` with no flags includes regression and will be red.

**Never "fix" a red `test:regression` by editing the test.** See
`tests/regression/README.md`.

## Gotchas

- **`spawnSync npx.cmd EINVAL` on Windows.** Node refuses to spawn `.cmd` shims
  without `shell: true`. Any script that shells out to `npm`/`npx` breaks here.
  The driver runs `node_modules/vite/bin/vite.js` with `process.execPath`
  instead; do the same for Playwright via
  `createRequire(import.meta.url).resolve('@playwright/test/cli')`.
- **Killing `npm run dev` orphans Vite.** The npm wrapper dies, the child keeps
  port 5173 bound, and the next run silently reuses the stale server. Kill by
  port instead:
  ```powershell
  Get-NetTCPConnection -LocalPort 5173 -State Listen |
    Select-Object -First 1 -ExpandProperty OwningProcess |
    ForEach-Object { Stop-Process -Id $_ -Force }
  ```
- **`localStorage` leaks between runs** and will silently corrupt results.
  Always `clear` first. Worse: only *adding* a task is persisted — toggle, edit
  and delete are not — so a reload resurrects deleted tasks and un-completes
  completed ones. That is an app bug, not a driver bug.
- **The add form and the inline edit form each contain a textarea and two
  selects.** Page-level locators like `getByRole('combobox').first()` match both
  and throw strict-mode violations. Scope to `form` for the add form and to the
  specific `.task-item` for an edit form.
- **A card in edit mode has no `<h3>`**, so you cannot locate it by title while
  editing. Only one edit form can be open at a time, so `save`/`cancel` safely
  target the first match.
- **Card background never changes.** `bg` is `rgb(255,255,255)` whether complete
  or not (`bg-white` beats the conditional `bg-green-200`). Read completion from
  the **button label** — `Uncomplete` means the task is complete. Never assert on
  colour.
- **The edit dropdowns lie.** They *display* the task's real Importance/Label
  while the state behind them holds `Low`/`Hobby`, so Save writes values the user
  never saw. `importanceShown` is what is displayed, not what will be saved.
- **`delete` matches by title, not id** — deleting one of two same-titled tasks
  removes both.
- **`tests/regression/` must stay red.** Never run `playwright-test-healer` on
  it; see `CLAUDE.md` and `tests/regression/README.md`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ERROR: locator.click: Timeout 5000ms exceeded` | The card title does not exist, or it is in edit mode (no `<h3>`). Run `state` to see what is actually rendered. |
| `ERROR: unknown command: <x>` | Typo — see the command table. Exits 1. |
| `dev server did not come up within 60s` | Port 5173 held by an orphaned Vite. Kill by port (above). |
| `vite not installed at ...` | Run `npm install`. |
| Driver says "already up" but the app looks stale | Orphaned Vite from an earlier run serving old code. Kill by port and re-run. |
| `browserType.launch: Executable doesn't exist` | Run `npx playwright install chromium`. |
