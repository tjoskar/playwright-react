"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountAndTakeSnapshot = void 0;
const react_dom_1 = require("react-dom");
const react_1 = __importDefault(require("react"));
const testPath = new URL(document.location.href).searchParams.get("test");
const EXPOSE_FUNCTION_NAME = "__PLAYWRIGHT_REACT__";
const playwrightBridge = window[EXPOSE_FUNCTION_NAME];
async function executeTest(cb) {
    if (!testPath) {
        throw new Error(`"test" param is missing. You need to add a path to a test in the url. eg. "?test=my/path/Test.tsx"`);
    }
    const tests = await Promise.resolve().then(() => __importStar(require(/* @vite-ignore */ testPath))).then((m) => m.tests);
    const rootNode = document.getElementById("app");
    for (const test of tests) {
        if (!test || !test.name || !test.render) {
            throw new Error(`Snapshot test most inclode both "name" and "render"`);
        }
        if (test.viewportSize) {
            await playwrightBridge('setViewportSize', test.viewportSize);
        }
        (0, react_dom_1.unmountComponentAtNode)(rootNode);
        const CompUnderTest = () => react_1.default.createElement(react_1.default.Fragment, null, test.render());
        await asyncRender(cb(CompUnderTest), rootNode);
        await playwrightBridge('snapshot', test.name);
    }
}
function asyncRender(element, node) {
    return new Promise((resolve, reject) => {
        try {
            (0, react_dom_1.render)(element, node, resolve);
        }
        catch (error) {
            reject(error);
        }
    });
}
function mountAndTakeSnapshot(cb) {
    if (!playwrightBridge) {
        // We are not running in playwright
        window[EXPOSE_FUNCTION_NAME] = (...args) => {
            console.log('Calling playwright with: ', args);
            return Promise.resolve();
        };
        executeTest(cb);
    }
    else {
        playwrightBridge.run = () => executeTest(cb);
    }
}
exports.mountAndTakeSnapshot = mountAndTakeSnapshot;
