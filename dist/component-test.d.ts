/// <reference types="react" />
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
    execute: (fn: (args: TestArgs) => Promise<() => void>) => Promise<MountResult>;
}
export declare const componentTest: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & TestFixtures, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export {};
