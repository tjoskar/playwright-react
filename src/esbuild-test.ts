import { Page } from "@playwright/test";
import { build } from "esbuild";
import { parentModule } from "./get-parent-module";

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

export function setup<
  Components extends Record<string, any>
>(components: Components) {
  const CompsStr = Object.entries(components)
    .map(([name, load]) => `const ${name} = await (${load})();`)
    .join("");
  const CompsNameArgument = `{ ${Object.keys(components).join(',')} }`;

  type AwaitedComponents = { [K in keyof Components]: Awaited<ReturnType<Components[K]>> };

  async function mount(page: Page, cp: (comps: AwaitedComponents) => JSX.Element) {
    const buildResult = await build({
      bundle: true,
      write: false,
      watch: false,
      stdin: {
        contents: `
          import { render } from 'react-dom';
          import React from 'react';
          async function setup() {
            if (!window._interopRequireWildcard) {
              window._interopRequireWildcard = i => i;
            }
            if (!window._react) {
              window._react = React;
            }
            ${CompsStr}
            const ComponentToTest = ${cp};
            await new Promise(r => {
              render(ComponentToTest(${CompsNameArgument}), document.getElementById('root'), r);
            });
          }
    
          window.setup = setup;
        `,
        resolveDir: parentModule(),
        sourcefile: "imaginary-file.js",
        loader: "ts",
      },
    });

    await page.setContent(`
      <div id="root">NO COMPONENT</div>
      <script>
        ${buildResult.outputFiles[0].text}
      </script>
    `);
    await page.evaluate(() => {
      return (window as any).setup();
    });
  }

  return mount;
}
