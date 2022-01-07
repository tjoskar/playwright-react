import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { setup } from "../../src/esbuild-test";

const mount = setup({
  MyComponent: () => import("../MyComponent").then((c) => c.MyComponent),
});

test("Test MyComponent by using creat element in the test", async ({ page }) => {
  await mount(page, ({ MyComponent }) => {
    return createElement(MyComponent, { name: "John" });
  });

  await expect(page.locator('text=Hello! My name is John')).toBeVisible();
});

