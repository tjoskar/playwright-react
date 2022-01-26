import { expect } from '@playwright/test';
import { componentTest } from "@kivra/playwright-react";

componentTest('Click on MyButton', async ({ page, mount }) => {
  await mount(() => import('../MyButton').then(c => c.MyButton));
  
  await page.click('text=Click on me');

  await expect(page.locator('text=You have clicked me')).toBeVisible();
});

componentTest('MyButton is a button', async ({ page, mount }) => {
  await mount(() => import('../MyButton').then(c => c.MyButton));

  await expect(page.locator('button')).toBeVisible();
});