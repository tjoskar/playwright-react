import { expect } from "@playwright/test";
import { componentTest } from "@kivra/playwright-react";

componentTest("Render my text", async ({ page, mount }) => {
  mount(() => import("./components/MyText.cut").then((c) => c.SomeText));

  await expect(page.locator("text=My text is: Some text")).toBeVisible();
});

componentTest("MyText is a paragraf", async ({ page, mount }) => {
  mount(() => import("./components/MyText.cut").then((c) => c.SomeText));

  await expect(page.locator("p")).toBeVisible();
});
