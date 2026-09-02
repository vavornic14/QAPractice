// spec: specs/task-manager.plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('User Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('US-01 add a task with all fields populated', async ({ page }) => {
    const form = page.locator('form');
    const titleInput = form.getByRole('textbox', { name: 'Task Title' });
    const descriptionInput = form.getByRole('textbox', { name: 'Task Description' });

    // 2. Fill the 'Task Title' textbox in the add form with 'Buy groceries'.
    await titleInput.fill('Buy groceries');

    // 3. Fill the 'Task Description' textarea in the add form with 'Get milk and eggs'.
    await descriptionInput.fill('Get milk and eggs');

    // 4. Select 'High' in the Importance select of the add form.
    await form.locator('select').nth(0).selectOption('High');

    // 5. Select 'Home' in the Label select of the add form.
    await form.locator('select').nth(1).selectOption('Home');

    // 6. Click the 'Add Task' button.
    await form.getByRole('button', { name: 'Add Task' }).click();

    const card = page.locator('.task-item').filter({ has: page.getByRole('heading', { name: 'Buy groceries' }) });
    await expect(card.getByRole('heading', { name: 'Buy groceries' })).toBeVisible();
    await expect(card.getByText('Get milk and eggs')).toBeVisible();
    await expect(card.getByText('Importance: High')).toBeVisible();
    await expect(card.getByText('Label: Home')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Complete', exact: true })).toBeVisible();

    // expect: The add form's Title and Description fields are cleared after submission.
    await expect(titleInput).toHaveValue('');
    await expect(descriptionInput).toHaveValue('');
  });
});
