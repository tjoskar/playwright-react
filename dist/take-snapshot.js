"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeSnapshot = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const fast_glob_1 = __importDefault(require("fast-glob"));
const component_test_1 = require("./component-test");
const esbuild_1 = require("esbuild");
const PLAYWRIGHT_CONFIG_PATH = (0, path_1.resolve)("playwright.config.ts");
function takeSnapshot(overwriteConfig) {
    const configFileContent = readConfigFile();
    const config = {
        ...configFileContent,
        ...overwriteConfig,
    };
    const snapshotFileGlob = config.snapshotFileGlob || "./src/**/*.snap.tsx";
    const snapFiles = fast_glob_1.default.sync(snapshotFileGlob);
    for (const snapFile of snapFiles) {
        (0, component_test_1.componentTest)(snapFile, async ({ snapshot }) => {
            await snapshot(snapFile, config);
        });
    }
}
exports.takeSnapshot = takeSnapshot;
function readConfigFile() {
    const config = bundleConfigFile(PLAYWRIGHT_CONFIG_PATH);
    const tempFileName = PLAYWRIGHT_CONFIG_PATH + ".js";
    (0, fs_1.writeFileSync)(tempFileName, config);
    const configContent = require(tempFileName).default.react;
    (0, fs_1.unlinkSync)(tempFileName);
    return {
        ...configContent,
        snapshotUrl: configContent.snapshotUrl || "http://localhost:3000/snapshot",
    };
}
function bundleConfigFile(fileName) {
    const result = (0, esbuild_1.buildSync)({
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
