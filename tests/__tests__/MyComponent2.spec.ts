import { expect } from "@playwright/test";
import { componentTest } from "../../src/component-test";

componentTest(
  "Test MyComponent by import a component under test",
  async ({ page, mount }) => {
    await mount(() => import("./cut").then((c) => c.Stannis));

    await expect(page.locator("text=Hello! My name is Stannis")).toBeVisible();
  }
);

componentTest(
  "Test MyComponent with a spy function",
  async ({ page, mount }) => {
    const { events } = await mount((utils) =>
      import("./cut").then((c) => c.attachClickListener(utils))
    );

    expect(events.callCount("click")).toBe(0);
    await page.locator("text=Hello! My name is Dexter").click();
    expect(events.callCount("click")).toBe(1);
    expect(events.args("click")[0][0]).toBe("Dexter");
  }
);

componentTest(
  "Test MyComponent by user react testing library",
  async ({ execute }) => {
    await execute(() => import("./cut-with-rtl").then((c) => c.test));
  }
);
