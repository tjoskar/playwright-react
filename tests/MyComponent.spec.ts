import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { setup } from "../src/esbuild-test";

const mount = setup(__dirname, {
  MyComponent: () => import("./MyComponent").then((c) => c.MyComponent),
});

test("Test mycomponent", async ({ page }) => {
  await mount(page, ({ MyComponent }) => {
    return createElement(MyComponent, { name: "John" });
  });

  await expect(page.locator('text=Hello! My name is John')).toBeVisible();
});

