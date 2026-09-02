import { test, expect, Page } from '@playwright/test';

/**
 * REG-01 - EXPECTED TO FAIL.
 *
 * Bug: saving an edit without changing anything destroys three fields.
 * The description is erased, Importance is downgraded High -> Low and Label is
 * changed Social -> Hobby, even though the edit form displayed High and Social.
 *
 * The assertions below describe CORRECT behaviour, so this test fails against
 * the current build and will pass - unmodified - once the bug is fixed.
 *
 * DO NOT weaken these assertions to make this pass. See tests/regression/README.md.
 */

const addTask = async (page: Page, title: string, description: string, importance: string, label: string) => {
  const form = page.locator('form');
  await form.getByPlaceholder('Task Title').fill(title);
  await form.getByPlaceholder('Task Description').fill(description);
  await form.locator('select').nth(0).selectOption(importance);
  await form.locator('select').nth(1).selectOption(label);
  await form.getByRole('button', { name: 'Add Task' }).click();
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('REG-01 saving an unmodified edit preserves description, importance and label', async ({ page }) => {
  const card = page.locator('.task-item');

  await addTask(page, 'Keep me', 'My description', 'High', 'Social');

  // Sanity: the task was created with the values we asked for.
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('My description');
  await expect(card).toContainText('Importance: High');
  await expect(card).toContainText('Label: Social');

  // Open the edit form and save without touching anything.
  await card.getByRole('button', { name: 'Edit' }).click();
  await card.getByRole('button', { name: 'Save' }).click();

  // A no-op edit must leave the task exactly as it was.
  // Currently ALL THREE of these fail: the description is erased, and the card
  // reads "Importance: Low" / "Label: Hobby".
  await expect(card).toContainText('My description');
  await expect(card).toContainText('Importance: High');
  await expect(card).toContainText('Label: Social');
});
