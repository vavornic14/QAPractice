// spec: specs/task-manager.plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('User Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('US-05 filter tasks by label', async ({ page }) => {
    const form = page.locator('form');
    const titleInput = form.getByRole('textbox', { name: 'Task Title' });
    const addButton = form.getByRole('button', { name: 'Add Task' });

    // 2. Add a task titled 'Work task' (Title only, Label defaults to Work), click Add Task.
    await titleInput.fill('Work task');
    await addButton.click();

    // 3. Add a task titled 'Social task', set its Label select (in the add form) to 'Social', click Add Task.
    await titleInput.fill('Social task');
    await form.locator('select').nth(1).selectOption('Social');
    await addButton.click();

    // expect: Two .task-item cards are visible: 'Work task' (Label: Work) and 'Social task' (Label: Social).
    const workCard = page.locator('.task-item').filter({ has: page.getByRole('heading', { name: 'Work task' }) });
    const socialCard = page.locator('.task-item').filter({ has: page.getByRole('heading', { name: 'Social task' }) });
    await expect(workCard.getByText('Label: Work')).toBeVisible();
    await expect(socialCard.getByText('Label: Social')).toBeVisible();

    // 4. In the .filter-sort area, select 'Social' in the label filter dropdown.
    const filterSort = page.locator('.filter-sort');
    await filterSort.locator('select').nth(0).selectOption('Social');

    // expect: Only the 'Social task' card remains visible.
    await expect(socialCard.getByRole('heading', { name: 'Social task' })).toBeVisible();
    // expect: The 'Work task' card is no longer visible.
    await expect(page.getByRole('heading', { name: 'Work task' })).not.toBeVisible();
    await expect(page.locator('.task-item')).toHaveCount(1);

    // 5. Change the label filter dropdown back to 'All'.
    await filterSort.locator('select').nth(0).selectOption('All');

    // expect: Both 'Work task' and 'Social task' cards are visible again.
    await expect(page.getByRole('heading', { name: 'Work task' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Social task' })).toBeVisible();
  });
});
