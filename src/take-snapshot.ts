import { resolve } from "path";
import { writeFileSync, unlinkSync } from 'fs';
import glob from "fast-glob";
import { componentTest } from "./component-test";
import type { ReatConfig } from "./type";
import { buildSync } from "esbuild";

const PLAYWRIGHT_CONFIG_PATH = resolve("playwright.config.ts");

export function takeSnapshot(overwriteConfig?: Partial<ReatConfig>) {
  const configFileContent = readConfigFile();
  const config: ReatConfig = {
    ...configFileContent,
    ...overwriteConfig,
  };
  const snapshotFileGlob = config.snapshotFileGlob || './src/**/*.snap.tsx';
  const snapFiles = glob.sync(snapshotFileGlob);

  for (const snapFile of snapFiles) {
    componentTest(snapFile, async ({ snapshot }) => {
      await snapshot(snapFile, config);
    });
  }
}

function readConfigFile(): ReatConfig {
  const config = bundleConfigFile(PLAYWRIGHT_CONFIG_PATH);
  const tempFileName = PLAYWRIGHT_CONFIG_PATH + ".js";
  writeFileSync(tempFileName, config);
  const configContent: ReatConfig = require(tempFileName).default.react;
  unlinkSync(tempFileName);
  return {
    ...configContent,
    snapshotUrl: configContent.snapshotUrl || 'http://localhost:3000/snapshot'
  };
}

function bundleConfigFile(fileName: string): string {
  const result = buildSync({
    absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    outfile: "out.js",
    write: false,
    platform: "node",
    bundle: true,
    format: "cjs",
    sourcemap: "inline",
    metafile: false,
  });
  return result.outputFiles[0].text;
}
