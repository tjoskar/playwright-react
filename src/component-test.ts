import { Page, test } from "@playwright/test";
import { build } from "esbuild";
import { parentModule } from "./get-parent-module";

export interface TestArgs {
  spy<Args extends any[], RetVal = any>(
    name: string,
    fn?: (...args: Args) => RetVal
  ): (...args: Args) => RetVal;
}

interface MountResult {
  events: {
    args(name: string): any[][];
    callCount(name: string): number;
  };
}

interface TestFixtures {
  mount: (
    comp: (args: TestArgs) => Promise<() => JSX.Element>
  ) => Promise<MountResult>;
  execute: (
    fn: (args: TestArgs) => Promise<() => void>
  ) => Promise<MountResult>;
}

export const componentTest = test.extend<TestFixtures>({
  execute: ({ page }, use) => {
    const _execute = async (fn: (args: TestArgs) => Promise<() => void>) => {
      return setupPage(
        page,
        `
        if (!window._interopRequireWildcard) {
          window._interopRequireWildcard = i => i;
        }
        async function run() {
          ${argsSetup}
          const fn = await (${fn})(args);
          await fn();
        }

        window.run = run;
      `
      );
    };
    use(_execute);
  },
  mount: ({ page }, use) => {
    const _mount = async (
      comp: (args: TestArgs) => Promise<() => JSX.Element>
    ) => {
      return setupPage(
        page,
        `
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
      `
      );
    };
    use(_mount);
  },
});

const EXPOSE_FUNCTION_NAME = "__PLAYWRIGHT_REACT__";

async function setupPage(page: Page, source: string) {
  const events = new Map<string, any[][]>();
  const script = await compile(source);
  await page.exposeFunction(
    EXPOSE_FUNCTION_NAME,
    (type: string, name: string, args: any[]) => {
      if (type !== "spy") {
        console.log(`Unsupported ${EXPOSE_FUNCTION_NAME} type`);
        return;
      }
      if (!events.has(name)) {
        events.set(name, []);
      }
      events.get(name)?.push(args);
    }
  );
  await attachScriptToPage(page, script);
  return {
    events: {
      args(name: string) {
        return events.get(name) || [];
      },
      callCount(name: string) {
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
