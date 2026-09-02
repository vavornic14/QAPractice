import { test, expect, Page } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

/**
 * VIS-01 - all 24 combinations of the task properties.
 *
 * 3 Importance x 4 Label x 2 Completeness = 24. Each combination becomes its
 * OWN test, generated at collection time by the loop below - not a single test
 * with 24 iterations inside it. That matters:
 *
 *   - one broken combination fails one test, and the other 23 still run and
 *     still produce their screenshots. A single looping test would abort at the
 *     first failure and silently skip every combination after it.
 *   - the report names the exact combination that broke.
 *   - they parallelise.
 *
 * Each test is independent and starts from cleared storage, so a screenshot
 * shows exactly one task: the combination under test. That keeps the visual
 * baseline stable - a cumulative screenshot would change for every later
 * combination whenever an earlier one changed, making Argos diffs unreadable.
 *
 * Screenshots are taken with argosScreenshot(), which writes into ./screenshots
 * and is what the visual CI workflow uploads for diffing.
 */

const IMPORTANCES = ['Low', 'Medium', 'High'] as const;
const LABELS = ['Work', 'Social', 'Home', 'Hobby'] as const;
const COMPLETENESS = [false, true] as const;

type Combo = {
  index: number;
  importance: (typeof IMPORTANCES)[number];
  label: (typeof LABELS)[number];
  completed: boolean;
  slug: string;
  title: string;
};

/** Build all 24 combinations with a deterministic 1-based index. */
const combinations: Combo[] = [];
for (let i = 0; i < IMPORTANCES.length; i++) {
  for (let l = 0; l < LABELS.length; l++) {
    for (let c = 0; c < COMPLETENESS.length; c++) {
      const index = i * 8 + l * 2 + c + 1;
      const importance = IMPORTANCES[i];
      const label = LABELS[l];
      const completed = COMPLETENESS[c];
      const state = completed ? 'complete' : 'incomplete';
      combinations.push({
        index,
        importance,
        label,
        completed,
        slug: `combo-${String(index).padStart(2, '0')}-${importance.toLowerCase()}-${label.toLowerCase()}-${state}`,
        // Titles are capitalised so the app's own capitalisation is a no-op and
        // the rendered title matches what we assert.
        title: `Combo ${String(index).padStart(2, '0')} ${importance} ${label} ${completed ? 'Complete' : 'Incomplete'}`,
      });
    }
  }
}

// Guard the matrix itself: if this ever stops being 24 unique combinations the
// suite is no longer testing what it claims to.
const uniqueIndices = new Set(combinations.map((c) => c.index));
if (combinations.length !== 24 || uniqueIndices.size !== 24) {
  throw new Error(`expected 24 unique combinations, got ${combinations.length} (${uniqueIndices.size} unique)`);
}

const addTask = async (page: Page, c: Combo) => {
  const form = page.locator('form');
  await form.getByPlaceholder('Task Title').fill(c.title);
  await form.getByPlaceholder('Task Description').fill(`Auto-generated combination ${c.index}`);
  await form.locator('select').nth(0).selectOption(c.importance);
  await form.locator('select').nth(1).selectOption(c.label);
  await form.getByRole('button', { name: 'Add Task' }).click();
};

test.describe('VIS-01 task property combinations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  for (const c of combinations) {
    test(`${c.slug} - ${c.importance} / ${c.label} / ${c.completed ? 'complete' : 'incomplete'}`, async ({ page }) => {
      await addTask(page, c);

      const card = page.locator('.task-item');
      await expect(card).toHaveCount(1);
      await expect(card.locator('h3')).toHaveText(c.title);
      await expect(card).toContainText(`Importance: ${c.importance}`);
      await expect(card).toContainText(`Label: ${c.label}`);

      // Completion is driven and asserted via the toggle button's label.
      // The card background is white in both states (known bug), so colour is
      // not a usable signal. `exact` matters: a substring match on "Complete"
      // would also match "Uncomplete" and assert nothing.
      const toggle = card.locator('button').first();
      if (c.completed) {
        await toggle.click();
        await expect(toggle).toHaveText('Uncomplete');
      } else {
        await expect(toggle).toHaveText('Complete');
      }

      // Screenshot of the app right after this combination was added.
      await argosScreenshot(page, c.slug, { fullPage: true });
    });
  }
});
