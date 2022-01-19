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
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentTest = void 0;
const test_1 = require("@playwright/test");
const http = __importStar(require("http"));
const esbuild_1 = require("esbuild");
const get_parent_module_1 = require("./get-parent-module");
exports.componentTest = test_1.test.extend({
    execute: ({ page, server }, use) => {
        const _execute = async (fn) => {
            return setupPage(page, `
        if (!window._interopRequireWildcard) {
          window._interopRequireWildcard = i => i;
        }
        async function run() {
          ${argsSetup}
          const fn = await (${fn})(args);
          await fn();
        }

        window.run = run;
      `, server.port);
        };
        use(_execute);
    },
    mount: ({ page, server }, use) => {
        const _mount = async (comp) => {
            return setupPage(page, `
        import { render } from 'react-dom';
        import React from 'react';
        import { spy } from 'simple-spy';
        if (!window._interopRequireWildcard) {
          window._interopRequireWildcard = i => i;
        }
        async function run() {
          ${argsSetup}
          const ComponentToTest = await (${comp})(args);
          await new Promise(r => {
            render(React.createElement(ComponentToTest), document.getElementById('root'), r);
          });
        }

        window.run = run;
      `, server.port);
        };
        use(_mount);
    },
    server: [
        async ({}, use, { workerIndex }) => {
            const server = http.createServer((_request, response) => {
                response.writeHead(200, { "Content-Type": "text/html" });
                response.end("<html></html>", "utf-8");
            });
            const port = 9000 + workerIndex;
            server.listen(port);
            await new Promise((ready) => server.once("listening", ready));
            await use({ server, port });
            // Cleanup.
            await new Promise((done) => server.close(done));
        },
        // needs auto=true to start the server automatically
        { scope: "worker", auto: true },
    ],
});
const EXPOSE_FUNCTION_NAME = "__PLAYWRIGHT_REACT__";
async function setupPage(page, source, port) {
    const events = new Map();
    const script = await compile(source);
    await page.exposeFunction(EXPOSE_FUNCTION_NAME, (type, name, args) => {
        if (type !== "spy") {
            console.log(`Unsupported ${EXPOSE_FUNCTION_NAME} type`);
            return;
        }
        if (!events.has(name)) {
            events.set(name, []);
        }
        events.get(name)?.push(args);
    });
    await attachScriptToPage(page, script, port);
    return {
        events: {
            args(name) {
                return events.get(name) || [];
            },
            callCount(name) {
                return events.get(name)?.length || 0;
            },
        },
    };
}
const argsSetup = `
const args = {
  spy: (name, fn) => {
    return (...args) => {
      const argsToStore = (() => {
        try {
          JSON.stringify(args);
          return args;
        } catch {
          return undefined;
        }
      })();
      window.${EXPOSE_FUNCTION_NAME}('spy', name, argsToStore);
      return fn?.(...args);
    }
  }
};
`;
async function compile(source) {
    const buildResult = await (0, esbuild_1.build)({
        bundle: true,
        write: false,
        watch: false,
        stdin: {
            contents: source,
            resolveDir: (0, get_parent_module_1.parentModule)(),
            sourcefile: "imaginary-file.js",
            loader: "ts",
        },
    });
    return buildResult.outputFiles[0].text;
}
async function attachScriptToPage(page, script, port) {
    page.on("console", (message) => {
        if (message.type() === "error") {
            console.error(message.text());
        }
    });
    page.on("pageerror", (err) => {
        console.error(err.message);
    });
    await page.goto(`http://localhost:${port}`);
    await page.setContent(`
    <div id="root">NO CONTENT</div>
    <script>
      ${script}
    </script>
  `);
    await page.evaluate(() => {
        return window.run();
    });
}
