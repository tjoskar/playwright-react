/// <reference types="react" />
interface TestFixtures {
    mount: (comp: () => Promise<() => JSX.Element>) => Promise<void>;
    execute: (fn: () => Promise<() => void>) => Promise<void>;
}
export declare const componentTest: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & TestFixtures, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export {};
