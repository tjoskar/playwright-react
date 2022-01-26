import { expect, Page, test } from "@playwright/test";
import * as http from "http";
import { build } from "esbuild";
import { relative, join } from "path";
import { parentModule } from "./get-parent-module";
import { ReatConfig } from "./type";

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
  snapshot: (file: string, options: ReatConfig) => Promise<MountResult>;
  execute: (
    fn: (args: TestArgs) => Promise<() => void>
  ) => Promise<MountResult>;
  port: number;
}

export const componentTest = test.extend<
  TestFixtures,
  { server: { server: http.Server; port: number } }
>({
  execute: ({ page, server }, use) => {
    const _execute = async (fn: (args: TestArgs) => Promise<() => void>) => {
      return setupPage(
        page,
        `
        if (!window._interopRequireWildcard) {
          window._interopRequireWildcard = i => i;
        }
        async function run() {
          ${spyArgsSetup}
          const fn = await (${fn})(args);
          await fn();
        }

        window.run = run;
      `,
        server.port
      );
    };
    use(_execute);
  },
  mount: ({ page, server }, use) => {
    const _mount = async (
      comp: (args: TestArgs) => Promise<() => JSX.Element>
    ) => {
      return setupPage(
        page,
        `
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
      `,
        server.port
      );
    };
    use(_mount);
  },
  snapshot: ({ page, server }, use) => {
    const _snapshot = async (file: string, options: ReatConfig) => {
      const parentModulePath = parentModule();
      let wrapperImport =
        "const Wrapper = ({ children }) => React.createElement('div', null, children);";
      if (options.wrapper) {
        wrapperImport = `import { ${
          options.wrapper.componentName
        } as Wrapper } from '${relative(
          parentModulePath,
          join(process.cwd(), options.wrapper.path)
        )}';`;
      }
      const filePath = relative(parentModulePath, join(process.cwd(), file));
      const codeToCompile = `
      import { render, unmountComponentAtNode } from 'react-dom';
      import React from 'react';
      import { tests } from '${filePath.replace(".tsx", "")}';
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

async function setupPage(
  page: Page,
  source: string,
  port: number,
  resolveDir: string = parentModule()
) {
  const events = new Map<string, any[][]>();
  const script = await compile(source, resolveDir);
  await page.exposeFunction(
    EXPOSE_FUNCTION_NAME,
    async (type: string, ...args: any[]) => {
      if (type === "spy" && args[0]) {
        const [name, ...eventArgs] = args as [string, ...any[]];
        if (!events.has(name)) {
          events.set(name, []);
        }
        events.get(name)?.push(eventArgs);
      } else if (type === "snapshot" && args[0]) {
        const [name] = args as [string];
        expect(await page.screenshot()).toMatchSnapshot(name + ".png");
      } else if (type === "setViewportSize" && args[0]) {
        const [size] = args as [{ width: number; height: number }];
        await page.setViewportSize(size);
      } else {
        console.log(`Unsupported ${EXPOSE_FUNCTION_NAME} type`);
        return;
      }
    }
  );
  await attachScriptToPage(page, script, port);
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

async function compile(source: string, resolveDir: string) {
  const buildResult = await build({
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

async function attachScriptToPage(page: Page, script: string, port: number) {
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
    return (window as any).run();
  });
}
