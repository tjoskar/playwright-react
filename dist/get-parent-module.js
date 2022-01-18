"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentModule = void 0;
const path_1 = require("path");
function parentModule() {
    const stacks = [...new Set(callsites().map((s) => s.getFileName()))];
    const filename = stacks[2];
    if (!filename) {
        throw new Error("Could not get filename of the test");
    }
    return (0, path_1.dirname)(filename);
}
exports.parentModule = parentModule;
function callsites() {
    const _prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack.slice(1);
    Error.prepareStackTrace = _prepareStackTrace;
    return stack;
}
