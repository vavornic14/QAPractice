// spec: specs/task-manager.plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('User Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('US-04 delete a task when titles are distinct', async ({ page }) => {
    const form = page.locator('form');
    const titleInput = form.getByRole('textbox', { name: 'Task Title' });
    const addButton = form.getByRole('button', { name: 'Add Task' });

    // 2. Add a task titled 'Buy groceries' (Title only, click Add Task).
    await titleInput.fill('Buy groceries');
    await addButton.click();

    // 3. Add a second task titled 'Default task' (Title only, click Add Task).
    await titleInput.fill('Default task');
    await addButton.click();

    // expect: Two .task-item cards are visible: 'Buy groceries' and 'Default task'.
    await expect(page.getByRole('heading', { name: 'Buy groceries' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Default task' })).toBeVisible();
    await expect(page.locator('.task-item')).toHaveCount(2);

    // 4. Click the 'Delete' button on the 'Buy groceries' card.
    const groceriesCard = page.locator('.task-item').filter({ has: page.getByRole('heading', { name: 'Buy groceries' }) });
    await groceriesCard.getByRole('button', { name: 'Delete' }).click();

    // expect: The 'Buy groceries' card is removed from the page.
    await expect(page.getByRole('heading', { name: 'Buy groceries' })).not.toBeVisible();

    // expect: Exactly one .task-item card remains, with heading 'Default task'.
    await expect(page.locator('.task-item')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Default task' })).toBeVisible();
  });
});
