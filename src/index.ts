import type { PlaywrightTestConfig as Ptc } from "@playwright/test";
export type { SnapshotTest } from "./client/render-snapshot-component";
export { setup } from "./esbuild-test";
export { type TestArgs, componentTest } from "./component-test";
export { takeSnapshot } from "./take-snapshot";
import type { ReactConfig } from "./type";

export { ReactConfig };

export interface PlaywrightTestConfig extends Ptc {
  react: ReactConfig;
}
