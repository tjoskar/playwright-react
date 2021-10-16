import { expect, test } from '@playwright/test';
import { createElement } from 'react';
import { setup } from "playwright-react";

// Set up the components you want to test. You can add as many as you want.
const mount = setup(__dirname, {
  MyText: () => import('./MyText').then(c => c.MyText),
});

test('Render my text', async ({ page }) => {
  await mount(page, ({ MyText }) => {
    return createElement(MyText, { text: 'Some text' });
  });

  await expect(page.locator('text=My text is: Some text')).toBeVisible();
});

test('MyText is a paragraf', async ({ page }) => {
  await mount(page, ({ MyText }) => {
    return createElement(MyText, { text: 'Some text' });
  });

  await expect(page.locator('p')).toBeVisible();
});