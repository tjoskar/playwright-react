/// <reference types="react" />
declare const EXPOSE_FUNCTION_NAME = "__PLAYWRIGHT_REACT__";
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
    viewportSize?: {
        width: number;
        height: number;
    };
    waitTime?: number;
    waitForFunc?: () => Promise<void>;
}
export declare function mountAndTakeSnapshot(cb: (Component: () => JSX.Element) => JSX.Element): void;
export {};
