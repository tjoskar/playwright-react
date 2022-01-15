import { Page, test } from "@playwright/test";
import { build } from "esbuild";
import type { SpyReturn } from 'simple-spy';
import { parentModule } from "./get-parent-module";

export interface TestArgs {
  spy<Args extends any[], RetVal = any>(name: string, fn?: (...args: Args) => RetVal): (...args: Args) => RetVal;
}

interface MountResult {
  events: {
    args(name: string): any[][];
    callCount(name: string): number;
  }
}

interface TestFixtures {
  mount: (comp: (args: TestArgs) => Promise<() => JSX.Element>) => Promise<MountResult>;
  execute: (fn: (args: TestArgs) => Promise<() => void>) => Promise<void>;
  getCallbackRecord: (name: string) => Promise<{ args: any[][], callCount: number } | null>;
}

export const componentTest = test.extend<TestFixtures>({
  execute: ({ page }, use) => {
    const _execute = async (fn: (args: TestArgs) => Promise<() => void>) => {
      const script = await compile(`
        import { spy } from 'simple-spy';
        if (!window._interopRequireWildcard) {
          window._interopRequireWildcard = i => i;
        }
        async function run() {
          window.__spy = {};
          const args = {
            spy: (name, fn) => {
              window.__spy[name] = spy(fn);
              return window.__spy[name];
            }
          };
          const fn = await (${fn})(args);
          await fn();
        }

        window.run = run;
      `);
      await attachScriptToPage(page, script);
    };
    use(_execute);
  },
  mount: ({ page }, use) => {
    const _mount = async (comp: (args: TestArgs) => Promise<() => JSX.Element>) => {
      const events = new Map<string, any[][]>();
      const script = await compile(`
        import { render } from 'react-dom';
        import React from 'react';
        import { spy } from 'simple-spy';
        if (!window._interopRequireWildcard) {
          window._interopRequireWildcard = i => i;
        }
        async function run() {
          window.__spy = {};
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
                window.__PLAYWRIGHT_REACT__('spy', name, argsToStore);
                return fn?.(...args);
              }
              // window.__spy[name] = spy(fn);
              // return window.__spy[name];
            }
          };
          const ComponentToTest = await (${comp})(args);
          await new Promise(r => {
            render(React.createElement(ComponentToTest), document.getElementById('root'), r);
          });
        }

        window.run = run;
      `);
      await page.exposeFunction('__PLAYWRIGHT_REACT__', (type: string, name: string, args: any[]) => {
        if (type !== 'spy') {
          console.log('Unsupported __PLAYWRIGHT_REACT__ type');
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
          args(name: string) {
            return events.get(name) || [];
          },
          callCount(name: string) {
            return events.get(name)?.length || 0;
          }
        }
      };
    };
    use(_mount);
  },
  getCallbackRecord({ page }, use)  {
    const _getCallbackRecord = async (name: string) => {
      return await page.evaluate(([name]) => {
        const rec: SpyReturn<any[], any> | undefined = (window as any).__spy[name];
        if (!rec) {
          return null;
        }
        return {
          args: rec.args,
          callCount: rec.callCount
        };
      }, [name]);
    }
    use(_getCallbackRecord);
  }
});

async function compile(source: string) {
  const buildResult = await build({
    bundle: true,
    write: false,
    watch: false,
    stdin: {
      contents: source,
      resolveDir: parentModule(),
      sourcefile: "imaginary-file.js",
      loader: "ts",
    },
  });
  return buildResult.outputFiles[0].text;
}

async function attachScriptToPage(page: Page, script: string) {
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
    return (window as any).run();
  });
}
