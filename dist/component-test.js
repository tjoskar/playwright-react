"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentTest = void 0;
const test_1 = require("@playwright/test");
const esbuild_1 = require("esbuild");
const get_parent_module_1 = require("./get-parent-module");
exports.componentTest = test_1.test.extend({
    execute: ({ page }, use) => {
        const _execute = async (fn) => {
            const buildResult = await (0, esbuild_1.build)({
                bundle: true,
                write: false,
                watch: false,
                stdin: {
                    contents: `
            if (!window._interopRequireWildcard) {
              window._interopRequireWildcard = i => i;
            }
            async function run() {
              const fn = await (${fn})();
              await fn();
            }
      
            window.run = run;
          `,
                    resolveDir: (0, get_parent_module_1.parentModule)(),
                    sourcefile: "imaginary-file.js",
                    loader: "ts",
                },
            });
            page.on("console", (message) => {
                if (message.type() === "error") {
                    console.error(message.text());
                }
            });
            page.on("pageerror", (err) => {
                console.error(err.message);
            });
            await page.setContent(`
        <script>
          ${buildResult.outputFiles[0].text}
        </script>
      `);
            await page.evaluate(() => {
                return window.run();
            });
        };
        use(_execute);
    },
    mount: ({ page }, use) => {
        const _mount = async (comp) => {
            const buildResult = await (0, esbuild_1.build)({
                bundle: true,
                write: false,
                watch: false,
                stdin: {
                    contents: `
            import { render } from 'react-dom';
            import React from 'react';
            if (!window._interopRequireWildcard) {
              window._interopRequireWildcard = i => i;
            }
            async function setup() {
              const ComponentToTest = await (${comp})();
              await new Promise(r => {
                render(React.createElement(ComponentToTest), document.getElementById('root'), r);
              });
            }
      
            window.setup = setup;
          `,
                    resolveDir: (0, get_parent_module_1.parentModule)(),
                    sourcefile: "imaginary-file.js",
                    loader: "ts",
                },
            });
            page.on("console", (message) => {
                if (message.type() === "error") {
                    console.error(message.text());
                }
            });
            page.on("pageerror", (err) => {
                console.error(err.message);
            });
            await page.setContent(`
        <div id="root">NO COMPONENT</div>
        <script>
          ${buildResult.outputFiles[0].text}
        </script>
      `);
            await page.evaluate(() => {
                return window.setup();
            });
        };
        use(_mount);
    },
});
