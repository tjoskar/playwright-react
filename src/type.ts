export interface ReatConfig {
  snapshotFileGlob?: string;
  headerInject?: string[];
  wrapper?: {
    path: string;
    componentName: string;
  };
  viewportSize?: { width: number; height: number };
}
