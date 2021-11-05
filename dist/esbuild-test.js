"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = void 0;
const esbuild_1 = require("esbuild");
function setup(resolveDir, components) {
    const CompsStr = Object.entries(components)
        .map(([name, load]) => `const ${name} = await (${load})();`)
        .join('');
    const CompsNameArgument = `{ ${Object.keys(components).join(',')} }`;
    async function mount(page, cp) {
        const buildResult = await (0, esbuild_1.build)({
            bundle: true,
            write: false,
            watch: false,
            stdin: {
                contents: `
          import { render } from 'react-dom';
          import * as React from 'react';
          async function setup() {
            if (!window._interopRequireWildcard) {
              window._interopRequireWildcard = i => i;
            }
            if (!window.import_react) {
              window.import_react = React;
            }
            ${CompsStr}
            const ComponentToTest = ${cp};
            await new Promise(r => {
              render(ComponentToTest(${CompsNameArgument}), document.getElementById('root'), r);
            });
          }
    
          window.setup = setup;
        `,
                resolveDir,
                sourcefile: 'imaginary-file.js',
                loader: 'ts',
            },
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
    }
    return mount;
}
exports.setup = setup;
