import { PlaywrightTestConfig } from '@kivra/playwright-react';

const config: PlaywrightTestConfig = {
  testDir: 'src',
  testMatch: '**/*.spec.ts',
  webServer: {
    command: 'npm run start',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
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
