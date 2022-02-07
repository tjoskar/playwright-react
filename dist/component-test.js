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
            const source = `
        if (!window._interopRequireWildcard) {
          window._interopRequireWildcard = i => i;
        }
        async function run() {
          ${spyArgsSetup}
          const fn = await (${fn})(args);
          await fn();
        }

        window.run = run;
      `;
            const ref = setupPage(page);
            await attachScriptToPage(page, source, (0, get_parent_module_1.parentModule)(), server.port);
            return ref;
        };
        use(_execute);
    },
    mount: ({ page, server }, use) => {
        const _mount = async (comp) => {
            const source = `import { render } from 'react-dom';
      import React from 'react';
      if (!window._interopRequireWildcard) {
        window._interopRequireWildcard = i => i;
      }
      async function run() {
        ${spyArgsSetup}
        const ComponentToTest = await (${comp})(args);
        await new Promise(r => {
          render(React.createElement(ComponentToTest), document.getElementById('root'), r);
        });
      }

      window.run = run;`;
            const ref = setupPage(page);
            await attachScriptToPage(page, source, (0, get_parent_module_1.parentModule)(), server.port);
            return ref;
        };
        use(_mount);
    },
    snapshot: ({ page }, use) => {
        const _snapshot = async (file, options) => {
            await setupPage(page);
            await page.goto(`${options.snapshotUrl}?test=/${file}`);
            if (Array.isArray(options.headerInject)) {
                await page.evaluate((headerInject) => {
                    headerInject.forEach(h => {
                        document.head.insertAdjacentHTML('beforeend', h);
                    });
                }, options.headerInject);
            }
            await page.evaluate(EXPOSE_FUNCTION_NAME => {
                return window[EXPOSE_FUNCTION_NAME].run();
            }, EXPOSE_FUNCTION_NAME);
        };
        use(_snapshot);
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
async function setupPage(page) {
    const events = new Map();
    await page.exposeFunction(EXPOSE_FUNCTION_NAME, async (type, ...args) => {
        if (type === "spy" && args[0]) {
            const [name, ...eventArgs] = args;
            if (!events.has(name)) {
                events.set(name, []);
            }
            events.get(name)?.push(eventArgs);
        }
        else if (type === "snapshot" && args[0]) {
            const [name] = args;
            (0, test_1.expect)(await page.screenshot()).toMatchSnapshot(name + ".png");
        }
        else if (type === "setViewportSize" && args[0]) {
            const [size] = args;
            await page.setViewportSize(size);
        }
        else {
            console.log(`Unsupported ${EXPOSE_FUNCTION_NAME} type`);
            return;
        }
    });
    page.on("console", (message) => {
        if (message.type() === "error") {
            const text = message.text();
            // Mute network error logs
            if (text.startsWith('Failed to load resource:')) {
                return;
            }
            console.error(message.text());
        }
    });
    page.on("pageerror", (err) => {
        console.error(err.message);
    });
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
const spyArgsSetup = `
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
async function compile(source, resolveDir) {
    const buildResult = await (0, esbuild_1.build)({
        bundle: true,
        write: false,
        watch: false,
        stdin: {
            contents: source,
            resolveDir,
            sourcefile: "imaginary-file.js",
            loader: "ts",
        },
    });
    return buildResult.outputFiles[0].text;
}
async function attachScriptToPage(page, source, resolveDir, port) {
    const script = await compile(source, resolveDir);
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
