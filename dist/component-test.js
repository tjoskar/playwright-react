"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentTest = void 0;
const test_1 = require("@playwright/test");
const esbuild_1 = require("esbuild");
const get_parent_module_1 = require("./get-parent-module");
exports.componentTest = test_1.test.extend({
    execute: ({ page }, use) => {
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
      `);
        };
        use(_execute);
    },
    mount: ({ page }, use) => {
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
      `);
        };
        use(_mount);
    },
});
const EXPOSE_FUNCTION_NAME = "__PLAYWRIGHT_REACT__";
async function setupPage(page, source) {
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
    await attachScriptToPage(page, script);
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
async function attachScriptToPage(page, script) {
    page.on("console", (message) => {
        if (message.type() === "error") {
            console.error(message.text());
        }
    });
    page.on("pageerror", (err) => {
        console.error(err.message);
    });
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
