import { expect } from "@playwright/test";
import { componentTest } from "../../src/component-test";

componentTest("Test MyComponent by import a component under test", async ({ page, mount }) => {
  await mount(() => import('./cut').then(c => c.Stannis));

  await expect(page.locator('text=Hello! My name is Stannis')).toBeVisible();
});

componentTest("Test MyComponent by user react testing library", async ({ execute }) => {
  await execute(() => import('./cut-with-rtl').then(c => c.test));
});
