/// <reference types="react" />
import * as http from "http";
import { ReatConfig } from "./type";
export interface TestArgs {
    spy<Args extends any[], RetVal = any>(name: string, fn?: (...args: Args) => RetVal): (...args: Args) => RetVal;
}
interface MountResult {
    events: {
        args(name: string): any[][];
        callCount(name: string): number;
    };
}
interface TestFixtures {
    mount: (comp: (args: TestArgs) => Promise<() => JSX.Element>) => Promise<MountResult>;
    snapshot: (file: string, options: ReatConfig) => Promise<MountResult>;
    execute: (fn: (args: TestArgs) => Promise<() => void>) => Promise<MountResult>;
    port: number;
}
export declare const componentTest: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & TestFixtures, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions & {
    server: {
        server: http.Server;
        port: number;
    };
}>;
export {};
