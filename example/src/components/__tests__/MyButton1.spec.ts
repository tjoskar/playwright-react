import { expect, test } from '@playwright/test';
import { createElement } from 'react';
import { setup } from "@kivra/playwright-react";

const mount = setup({
  MyButton: () => import('../MyButton').then(c => c.MyButton),
});

test('Click on MyButton', async ({ page }) => {
  await mount(page, ({ MyButton }) => createElement(MyButton));

  await page.click('text=Click on me');

  await expect(page.locator('text=You have clicked me')).toBeVisible();
});

test('MyButton is a button', async ({ page }) => {
  await mount(page, ({ MyButton }) => createElement(MyButton));

  await expect(page.locator('button')).toBeVisible();
});