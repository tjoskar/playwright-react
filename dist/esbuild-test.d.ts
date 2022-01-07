/// <reference types="react" />
import { Page } from "@playwright/test";
declare type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
export declare function setup<Components extends Record<string, any>>(components: Components): (page: Page, cp: (comps: { [K in keyof Components]: Awaited<ReturnType<Components[K]>>; }) => JSX.Element) => Promise<void>;
export {};
