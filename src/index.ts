import type { PlaywrightTestConfig as Ptc } from '@playwright/test';
export { setup } from "./esbuild-test";
export { type TestArgs, componentTest } from "./component-test";
export { takeSnapshot } from './take-snapshot';
import type { ReatConfig } from './type';

export { ReatConfig };

export interface PlaywrightTestConfig extends Ptc {
  react: ReatConfig;
}
