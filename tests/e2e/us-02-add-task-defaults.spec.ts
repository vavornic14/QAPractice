// spec: specs/task-manager.plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('User Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('US-02 add a task with only a title applies documented defaults', async ({ page }) => {
    const form = page.locator('form');

    // 2. Fill the 'Task Title' textbox with 'Default task'. Leave Description empty and leave the Importance and Label selects at their pre-selected values.
    await form.getByRole('textbox', { name: 'Task Title' }).fill('Default task');

    // 3. Click the 'Add Task' button.
    await form.getByRole('button', { name: 'Add Task' }).click();

    const card = page.locator('.task-item').filter({ has: page.getByRole('heading', { name: 'Default task' }) });
    await expect(card.getByRole('heading', { name: 'Default task' })).toBeVisible();
    // expect: The card's description paragraph is empty.
    await expect(card.locator('p').first()).toHaveText('');
    await expect(card.getByText('Importance: Medium')).toBeVisible();
    await expect(card.getByText('Label: Work')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Complete', exact: true })).toBeVisible();
  });
});
