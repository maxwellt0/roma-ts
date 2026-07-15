import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  workers: 3,
  reporter: [['list']],
  use: {
    headless: true
  }
});
