import { defineConfig, devices } from '@playwright/test';

/**
 * Three projects, deliberately separated:
 *
 *   e2e         - user stories. MUST be green.
 *   regression  - encodes known, unfixed bugs. MUST be red.
 *   visual      - property-combination screenshots.
 *
 * A bare `npx playwright test` runs all three and WILL be red, because the
 * regression project is supposed to fail. Use the npm scripts instead:
 *
 *   npm run test:e2e            - user stories, expect green
 *   npm run test:visual         - combination screenshots, expect green
 *   npm run test:regression     - known bugs, expect red (this is correct)
 *   npm run test:guard          - asserts the regression tests are STILL red;
 *                                 green exit means nothing was healed away
 *
 * See tests/regression/README.md.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Retries are OFF everywhere on purpose. A retry can turn a genuine failure
  // into a pass and hide a real defect - which is exactly what the regression
  // project exists to prevent.
  retries: 0,

  workers: process.env.CI ? 1 : undefined,
  // HTML for humans, JUnit + JSON for CI to summarise without downloading the
  // artifact. All three are written whether the run passes or fails, which
  // matters here because the regression project is *supposed* to fail and its
  // report is the evidence that it failed for the right reason.
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'regression',
      testDir: './tests/regression',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
