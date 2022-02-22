import { componentTest, takeSnapshot } from "@kivra/playwright-react";

componentTest.describe.only('Snapshots', () => {
  takeSnapshot();
});

