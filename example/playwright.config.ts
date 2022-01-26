import { PlaywrightTestConfig } from '@kivra/playwright-react';

const config: PlaywrightTestConfig = {
  testDir: 'src',
  testMatch: '**/*.spec.ts',
  use: {
    viewport: null,
  },
  react: {
    snapshotFileGlob: './src/**/*.snap.tsx',
    wrapper: {
      path: './.playwright/Wrapper',
      componentName: 'Wrapper'
    }
  }
};
export default config;
