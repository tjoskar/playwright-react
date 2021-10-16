import { expect, test } from '@playwright/test';
import { createElement } from 'react';
import { setup } from "playwright-react";

// Set up the components you want to test. You can add as many as you want.
const mount = setup(__dirname, {
  MyButton: () => import('./MyButton').then(c => c.MyButton),
});

test('Click on MyButton', async ({ page }) => {
  await mount(page, ({ MyButton }) => {
    // You will get typescript intellisense here
    return createElement(MyButton);
  });

  await page.click('text=Click on me');

  await expect(page.locator('text=You have clicked me')).toBeVisible();
});

test('MyButton is a button', async ({ page }) => {
  await mount(page, ({ MyButton }) => {
    // You will get typescript intellisense here
    return createElement(MyButton);
  });

  await expect(page.locator('button')).toBeVisible();
});