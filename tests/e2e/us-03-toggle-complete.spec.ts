// spec: specs/task-manager.plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('User Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('US-03 toggle a task between complete and incomplete', async ({ page }) => {
    const form = page.locator('form');

    // 2. Add a task titled 'Toggle task' using only the Title field, then click 'Add Task'.
    await form.getByRole('textbox', { name: 'Task Title' }).fill('Toggle task');
    await form.getByRole('button', { name: 'Add Task' }).click();

    const card = page.locator('.task-item').filter({ has: page.getByRole('heading', { name: 'Toggle task' }) });

    // 3. Locate the 'Toggle task' .task-item card and click its 'Complete' button.
    await card.getByRole('button', { name: 'Complete', exact: true }).click();
    await expect(card.getByRole('button', { name: 'Uncomplete' })).toBeVisible();

    // 4. Click the same button again (now labelled 'Uncomplete').
    await card.getByRole('button', { name: 'Uncomplete' }).click();
    await expect(card.getByRole('button', { name: 'Complete', exact: true })).toBeVisible();
  });
});
