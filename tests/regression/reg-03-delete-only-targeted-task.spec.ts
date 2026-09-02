import { test, expect, Page } from '@playwright/test';

/**
 * REG-03 - EXPECTED TO FAIL.
 *
 * Bug: deletion matches tasks by title text rather than by unique id, so
 * deleting one of two tasks that share a title removes BOTH. There is no
 * confirmation prompt and no undo, making the loss unrecoverable.
 *
 * DO NOT weaken these assertions to make this pass. See tests/regression/README.md.
 */

const addTask = async (page: Page, title: string) => {
  const form = page.locator('form');
  await form.getByPlaceholder('Task Title').fill(title);
  await form.getByRole('button', { name: 'Add Task' }).click();
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('REG-03 deleting one of two tasks sharing a title removes only that task', async ({ page }) => {
  const cards = page.locator('.task-item');

  await addTask(page, 'Dup task');
  await addTask(page, 'Dup task');

  // Sanity: two distinct tasks exist that happen to share a title.
  await expect(cards).toHaveCount(2);

  // Delete the first one only.
  await cards.first().getByRole('button', { name: 'Delete' }).click();

  // Exactly one task must survive, and it must still be the "Dup task".
  // Currently fails: the count is 0 - a single click removed both.
  await expect(cards).toHaveCount(1);
  await expect(cards.first().locator('h3')).toHaveText('Dup task');
});
