var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
__export(exports, {
  setup: () => setup
});
var import_esbuild = __toModule(require("esbuild"));
function setup(resolveDir, components) {
  const CompsStr = Object.entries(components).map(([name, load]) => `const ${name} = await (${load})();`).join("");
  const CompsNameArgument = `{ ${Object.keys(components).join(",")} }`;
  async function mount(page, cp) {
    const buildResult = await (0, import_esbuild.build)({
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
        resolveDir,
        sourcefile: "imaginary-file.js",
        loader: "ts"
      }
    });
    await page.setContent(`
      <div id="root">NO COMPONENT</div>
      <script>
        ${buildResult.outputFiles[0].text}
      <\/script>
    `);
    await page.evaluate(() => {
      return window.setup();
    });
  }
  return mount;
}
