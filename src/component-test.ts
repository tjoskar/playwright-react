import { test } from "@playwright/test";
import { build } from "esbuild";
import { parentModule } from "./get-parent-module";

interface TestFixtures {
  mount: (comp: () => Promise<() => JSX.Element>) => Promise<void>;
  execute: (fn: () => Promise<() => void>) => Promise<void>;
}

export const componentTest = test.extend<TestFixtures>({
  execute: ({ page }, use) => {
    const _execute = async (fn: () => Promise<() => void>) => {
      const buildResult = await build({
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
          resolveDir: parentModule(),
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
        return (window as any).run();
      });
    };
    use(_execute);
  },
  mount: ({ page }, use) => {
    const _mount = async (comp: () => Promise<() => JSX.Element>) => {
      const buildResult = await build({
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
          resolveDir: parentModule(),
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
        return (window as any).setup();
      });
    };
    use(_mount);
  },
});
