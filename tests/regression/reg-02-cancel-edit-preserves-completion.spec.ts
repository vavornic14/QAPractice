import { test, expect } from '@playwright/test';

/**
 * REG-02 - EXPECTED TO FAIL.
 *
 * Bug: clicking Cancel in the inline edit form marks the task complete. The
 * Cancel handler closes the form AND toggles completion, so the universally
 * understood "discard my changes" action mutates data instead.
 *
 * Completion is asserted via the toggle button's label, not the card colour:
 * the card background never changes (a separate bug), so colour is not a
 * usable signal.
 *
 * DO NOT weaken these assertions to make this pass. See tests/regression/README.md.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('REG-02 cancelling an edit does not change completion state', async ({ page }) => {
  const card = page.locator('.task-item');
  const toggle = card.locator('button').first();

  const form = page.locator('form');
  await form.getByPlaceholder('Task Title').fill('Cancel me');
  await form.getByRole('button', { name: 'Add Task' }).click();

  // Sanity: a new task starts incomplete, so its toggle offers "Complete".
  await expect(card).toHaveCount(1);
  await expect(toggle).toHaveText('Complete');

  // Open the edit form, then cancel out of it without changing anything.
  await card.getByRole('button', { name: 'Edit' }).click();
  await card.getByRole('button', { name: 'Cancel' }).click();

  // The task must be untouched - still incomplete.
  // Currently fails: the toggle reads "Uncomplete", i.e. Cancel completed it.
  await expect(toggle).toHaveText('Complete');
});
