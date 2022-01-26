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
const path_1 = require("path");
const get_parent_module_1 = require("./get-parent-module");
exports.componentTest = test_1.test.extend({
    execute: ({ page, server }, use) => {
        const _execute = async (fn) => {
            return setupPage(page, `
        if (!window._interopRequireWildcard) {
          window._interopRequireWildcard = i => i;
        }
        async function run() {
          ${spyArgsSetup}
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

        window.run = run;
      `, server.port);
        };
        use(_mount);
    },
    snapshot: ({ page, server }, use) => {
        const _snapshot = async (file, options) => {
            const parentModulePath = (0, get_parent_module_1.parentModule)();
            let wrapperImport = "const Wrapper = ({ children }) => React.createElement('div', null, children);";
            if (options.wrapper) {
                wrapperImport = `import { ${options.wrapper.componentName} as Wrapper } from '${(0, path_1.relative)(parentModulePath, (0, path_1.join)(process.cwd(), options.wrapper.path))}';`;
            }
            const filePath = (0, path_1.relative)(parentModulePath, (0, path_1.join)(process.cwd(), file));
            const codeToCompile = `
      import { render, unmountComponentAtNode } from 'react-dom';
      import React from 'react';
      import { tests } from '${filePath.replace('.tsx', '')}';
      ${wrapperImport}
      if (!window._interopRequireWildcard) {
        window._interopRequireWildcard = i => i;
      }
      ${(options.headerInject || [])
                .map((strToInject) => {
                return `document.head.appendChild(${strToInject});`;
            })
                .join("\n")}
      async function run() {
        for (let test of tests) {
          if (!test.render || !test.name) {
            throw new Error('Both "render" and "name" must be assignd');
          }
          if (test.viewportSize) {
            await window.${EXPOSE_FUNCTION_NAME}('setViewportSize', test.viewportSize);
          }
          const ComponentToTest = () => {
            return React.createElement(Wrapper, null, test.render());
          }
          await new Promise(r => {
            render(React.createElement(ComponentToTest), document.getElementById('root'), r);
          });
          await window.${EXPOSE_FUNCTION_NAME}('snapshot', test.name);
        }
      }

      window.run = run;
    `;
            return setupPage(page, codeToCompile, server.port, parentModulePath);
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
async function setupPage(page, source, port, resolveDir = (0, get_parent_module_1.parentModule)()) {
    const events = new Map();
    const script = await compile(source, resolveDir);
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
            (0, test_1.expect)(await page.screenshot()).toMatchSnapshot(name + '.png');
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
