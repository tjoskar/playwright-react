export interface ReactConfig {
    snapshotFileGlob?: string;
    snapshotUrl?: string;
    headerInject?: string[];
    wrapper?: {
        path: string;
        componentName: string;
    };
    viewportSize?: {
        width: number;
        height: number;
    };
}
