#!/usr/bin/env node
/**
 * Task Manager driver.
 *
 * A programmatic handle on the running app: starts the Vite dev server if it
 * is not already up, opens a Chromium page with Playwright, and executes a
 * short command language against the UI. Screenshots land in .driver-shots/.
 *
 * Two ways to use it:
 *
 *   node .claude/skills/run-qapractice/driver.mjs smoke
 *   node .claude/skills/run-qapractice/driver.mjs run "clear" "add Buy milk|Two litres|High|Home" "shot one"
 *   echo "clear
 *   add Test task
 *   state" | node .claude/skills/run-qapractice/driver.mjs repl
 *
 * Commands (see CMDS below for the authoritative list):
 *   clear                          reset localStorage + reload (ALWAYS do this first)
 *   add T|desc|Importance|Label    fill the add form and submit; only T is required
 *   complete <title>               click the Complete/Uncomplete button on that card
 *   delete <title>                 click Delete on the first card with that title
 *   edit <title>                   open that card's inline edit form
 *   save / cancel                  click Save / Cancel in the open edit form
 *   filter <All|Work|Social|Home|Hobby>
 *   sort <asc|desc>
 *   state                          dump every card as JSON
 *   count                          number of cards
 *   shot <name>                    screenshot to .driver-shots/<name>.png
 *   eval <js>                      run JS in the page, print the result
 *   reload                         reload the page
 *
 * WINDOWS NOTE: this script never spawns `npm`/`npx`. Node refuses to
 * spawnSync a .cmd shim without `shell: true` (EINVAL), so the dev server is
 * launched by running node_modules/vite/bin/vite.js with the current Node
 * binary instead.
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');       // <unit>/ - repo root
const SHOTS = join(ROOT, '.driver-shots');
const URL = process.env.APP_URL ?? 'http://localhost:5173';
const HEADED = process.env.HEADED === '1';

const log = (...a) => console.log(...a);
const die = (m) => { console.error(`ERROR: ${m}`); process.exitCode = 1; };

/* ------------------------------------------------------------------ server */

async function isUp() {
  try {
    const r = await fetch(URL, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}

async function ensureServer() {
  if (await isUp()) { log(`dev server already up at ${URL}`); return null; }

  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(viteBin)) throw new Error(`vite not installed at ${viteBin} - run: npm install`);

  log('starting vite dev server...');
  const proc = spawn(process.execPath, [viteBin], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: false,
    env: { ...process.env, NO_COLOR: '1' },
  });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await isUp()) { log(`dev server up at ${URL}`); return proc; }
    await new Promise((r) => setTimeout(r, 400));
  }
  proc.kill();
  throw new Error('dev server did not come up within 60s');
}

/* ------------------------------------------------------------- page helpers */

const cards = (page) => page.locator('.task-item');

/** A card located by its visible title. */
const cardBy = (page, title) =>
  cards(page).filter({ has: page.locator('h3', { hasText: title }) }).first();

/**
 * The add form is the only <form> on the page. The inline edit form ALSO
 * contains a textarea and two selects, so every add-form locator is scoped to
 * `form` and every edit-form locator is scoped to its .task-item. Unscoped
 * page-level locators hit both and blow up on strict mode.
 */
async function addTask(page, spec) {
  const [title = '', desc = '', importance = '', label = ''] = spec.split('|').map((s) => s.trim());
  const form = page.locator('form');
  if (title) await form.getByPlaceholder('Task Title').fill(title);
  if (desc) await form.getByPlaceholder('Task Description').fill(desc);
  if (importance) await form.locator('select').nth(0).selectOption(importance);
  if (label) await form.locator('select').nth(1).selectOption(label);
  await form.getByRole('button', { name: 'Add Task' }).click();
}

async function dumpState(page) {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.task-item')) {
      const txt = (s) => el.querySelector(s)?.textContent?.trim() ?? null;
      const ps = [...el.querySelectorAll('p')].map((p) => p.textContent.trim());

      // A card in edit mode has no <h3> - its content is replaced by the
      // inline form. Report the form's live values instead of a row of nulls.
      const editInput = el.querySelector('input[type="text"]');
      if (editInput) {
        const sel = el.querySelectorAll('select');
        out.push({
          editing: true,
          titleField: editInput.value,
          descriptionField: el.querySelector('textarea')?.value ?? '',
          // What the dropdowns DISPLAY. Note these can disagree with what
          // Save actually writes - that is bug REG-01, not a driver fault.
          importanceShown: sel[0]?.value ?? null,
          labelShown: sel[1]?.value ?? null,
        });
        continue;
      }

      out.push({
        title: txt('h3'),
        description: ps.find((p) => !/^(Importance|Label):/.test(p)) ?? '',
        importance: (ps.find((p) => p.startsWith('Importance:')) ?? '').replace('Importance:', '').trim(),
        label: (ps.find((p) => p.startsWith('Label:')) ?? '').replace('Label:', '').trim(),
        // The card background NEVER changes (known bug), so completion is read
        // from the toggle button label, which is the only reliable signal.
        completed: el.querySelector('button')?.textContent?.trim() === 'Uncomplete',
        bg: getComputedStyle(el).backgroundColor,
      });
    }
    return out;
  });
}

/* ---------------------------------------------------------------- commands */

const CMDS = {
  async clear(page) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    log('localStorage cleared');
  },
  async reload(page) { await page.reload(); log('reloaded'); },
  async add(page, arg) { await addTask(page, arg); log(`added: ${arg}`); },
  async complete(page, title) {
    await cardBy(page, title).locator('button').first().click();
    log(`toggled: ${title}`);
  },
  async delete(page, title) {
    await cardBy(page, title).getByRole('button', { name: 'Delete' }).click();
    log(`deleted: ${title}`);
  },
  async edit(page, title) {
    await cardBy(page, title).getByRole('button', { name: 'Edit' }).click();
    log(`editing: ${title}`);
  },
  async save(page) {
    await cards(page).getByRole('button', { name: 'Save' }).first().click();
    log('saved');
  },
  async cancel(page) {
    await cards(page).getByRole('button', { name: 'Cancel' }).first().click();
    log('cancelled');
  },
  async filter(page, v) {
    await page.locator('.filter-sort select').nth(0).selectOption(v);
    log(`filter: ${v}`);
  },
  async sort(page, v) {
    await page.locator('.filter-sort select').nth(1).selectOption(v);
    log(`sort: ${v}`);
  },
  async state(page) { log(JSON.stringify(await dumpState(page), null, 2)); },
  async count(page) { log(String(await cards(page).count())); },
  async shot(page, name = 'shot') {
    mkdirSync(SHOTS, { recursive: true });
    const p = join(SHOTS, `${name}.png`);
    await page.screenshot({ path: p, fullPage: true });
    log(`screenshot: ${p}`);
  },
  async eval(page, js) { log(JSON.stringify(await page.evaluate(js), null, 2)); },
};

async function exec(page, line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const sp = trimmed.indexOf(' ');
  const name = (sp === -1 ? trimmed : trimmed.slice(0, sp)).toLowerCase();
  const arg = sp === -1 ? '' : trimmed.slice(sp + 1).trim();
  const fn = CMDS[name];
  if (!fn) { die(`unknown command: ${name}`); return; }
  await fn(page, arg);
}

/* -------------------------------------------------------------------- smoke */

/** One real user flow, end to end, with assertions and screenshots. */
async function smoke(page) {
  const problems = [];
  const check = (ok, what) => { log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) problems.push(what); };

  log('\n[1] add a task with all fields');
  await CMDS.clear(page);
  await addTask(page, 'Buy milk|Two litres|High|Home');
  let s = await dumpState(page);
  check(s.length === 1, 'one card exists');
  check(s[0]?.title === 'Buy milk', `title capitalised (got ${JSON.stringify(s[0]?.title)})`);
  check(s[0]?.importance === 'High', 'importance High');
  check(s[0]?.label === 'Home', 'label Home');
  check(s[0]?.completed === false, 'starts incomplete');
  await CMDS.shot(page, 'smoke-1-added');

  log('\n[2] toggle completion');
  await CMDS.complete(page, 'Buy milk');
  s = await dumpState(page);
  check(s[0]?.completed === true, 'toggled to complete');
  await CMDS.shot(page, 'smoke-2-completed');

  log('\n[3] filter by label');
  await addTask(page, 'Gym session|| |Social');
  await CMDS.filter(page, 'Social');
  check((await cards(page).count()) === 1, 'filter Social shows 1 card');
  await CMDS.filter(page, 'All');
  check((await cards(page).count()) === 2, 'filter All restores 2 cards');

  log('\n[4] delete');
  await CMDS.delete(page, 'Gym session');
  check((await cards(page).count()) === 1, 'one card left after delete');
  await CMDS.shot(page, 'smoke-3-final');

  log('\nsmoke: ' + (problems.length ? `${problems.length} FAILED` : 'all checks passed'));
  if (problems.length) { for (const p of problems) console.error(`  - ${p}`); process.exitCode = 1; }
}

/* --------------------------------------------------------------------- main */

const [mode = 'smoke', ...rest] = process.argv.slice(2);
let server = null;
let browser = null;

try {
  server = await ensureServer();
  browser = await chromium.launch({ headless: !HEADED });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  // The app is local and renders instantly, so a missing element means a wrong
  // command, not a slow page. Fail in 5s rather than Playwright's default 30s -
  // an agent iterating on commands should not wait half a minute for a typo.
  page.setDefaultTimeout(5_000);
  page.on('console', (m) => { if (m.type() === 'error') console.error(`[page error] ${m.text()}`); });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  if (mode === 'smoke') {
    await smoke(page);
  } else if (mode === 'run') {
    for (const line of rest) await exec(page, line);
  } else if (mode === 'repl') {
    const rl = createInterface({ input: process.stdin, terminal: false });
    for await (const line of rl) {
      if (line.trim() === 'quit') break;
      try { await exec(page, line); } catch (e) { die(e.message.split('\n')[0]); }
    }
  } else {
    die(`unknown mode: ${mode}. Use smoke | run | repl`);
  }
} catch (e) {
  die(e.message);
} finally {
  await browser?.close();
  server?.kill();
}
