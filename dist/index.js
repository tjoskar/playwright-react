"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeSnapshot = exports.componentTest = exports.setup = void 0;
var esbuild_test_1 = require("./esbuild-test");
Object.defineProperty(exports, "setup", { enumerable: true, get: function () { return esbuild_test_1.setup; } });
var component_test_1 = require("./component-test");
Object.defineProperty(exports, "componentTest", { enumerable: true, get: function () { return component_test_1.componentTest; } });
var take_snapshot_1 = require("./take-snapshot");
Object.defineProperty(exports, "takeSnapshot", { enumerable: true, get: function () { return take_snapshot_1.takeSnapshot; } });
