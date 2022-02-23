import { render as reactRender, unmountComponentAtNode } from "react-dom";
import React from "react";

const testPath = new URL(document.location.href).searchParams.get("test");
const EXPOSE_FUNCTION_NAME = "__PLAYWRIGHT_REACT__";
const playwrightBridge = window[EXPOSE_FUNCTION_NAME];

declare global {
  interface Window {
    [EXPOSE_FUNCTION_NAME]: ((...args: any[]) => Promise<void>) & {
      run?: () => Promise<void>;
    };
  }
}

export interface SnapshotTest {
  name?: string;
  render?(): JSX.Element;
  viewportSize?: { width: number; height: number };
  waitTime?: number;
  waitForFunc?: () => Promise<void>;
}

async function executeTest(
  cb: (Component: () => JSX.Element) => JSX.Element
): Promise<void> {
  if (!testPath) {
    throw new Error(
      `"test" param is missing. You need to add a path to a test in the url. eg. "?test=my/path/Test.tsx"`
    );
  }
  const tests: SnapshotTest[] = await import(/* @vite-ignore */ testPath).then(
    (m) => m.tests
  );
  const rootNode = document.getElementById("app")!;

  for (const test of tests) {
    if (!test || !test.name || !test.render) {
      throw new Error(`Snapshot test most inclode both "name" and "render"`);
    }
    if (test.viewportSize) {
      await playwrightBridge("setViewportSize", test.viewportSize);
    }
    unmountComponentAtNode(rootNode);
    const CompUnderTest = () => <>{test.render!()}</>;
    await asyncRender(cb(CompUnderTest), rootNode);
    if (test.waitTime) {
      await new Promise((res) => setTimeout(res, test.waitTime));
    }
    if (test.waitForFunc) {
      await test.waitForFunc();
    }
    await playwrightBridge("snapshot", test.name);
  }
}

function asyncRender(
  element: React.FunctionComponentElement<unknown>,
  node: Element
): Promise<void> {
  return new Promise<void>((resolve, reject): void => {
    try {
      reactRender(
        <div className="playwright_react_component_wrapper">{element}</div>,
        node,
        resolve
      );
    } catch (error) {
      reject(error);
    }
  });
}

export function mountAndTakeSnapshot(
  cb: (Component: () => JSX.Element) => JSX.Element
): void {
  if (!playwrightBridge) {
    // We are not running in playwright
    window[EXPOSE_FUNCTION_NAME] = (...args: any): Promise<void> => {
      console.log("Calling playwright with: ", args);
      return Promise.resolve();
    };
    executeTest(cb);
  } else {
    playwrightBridge.run = (): Promise<void> => executeTest(cb);
  }
}
