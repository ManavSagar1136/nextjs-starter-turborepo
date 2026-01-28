/**
 * Shared Playwright Configuration
 *
 * Base configuration for E2E tests across all apps.
 * Apps should extend this configuration with their specific settings.
 *
 * @example
 * ```ts
 * // apps/user/playwright.config.ts
 * import { basePlaywrightConfig } from '@buildbase/testing/config/playwright';
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   ...basePlaywrightConfig,
 *   testDir: './e2e',
 *   use: {
 *     ...basePlaywrightConfig.use,
 *     baseURL: 'http://localhost:3101',
 *   },
 *   webServer: {
 *     command: 'yarn dev',
 *     url: 'http://localhost:3101',
 *     reuseExistingServer: !process.env.CI,
 *   },
 * });
 * ```
 */

import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

/**
 * Base Playwright configuration
 * Extend this in your app's playwright.config.ts
 */
export const basePlaywrightConfig: PlaywrightTestConfig = {
  // Test directory (override in app config)
  testDir: "./e2e",

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    ...(process.env.CI ? [["github"] as ["github"]] : []),
  ],

  // Shared settings for all projects
  use: {
    // Base URL (override in app config)
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Collect trace on first retry
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",

    // Record video on first retry
    video: "on-first-retry",

    // Set default timeout for actions
    actionTimeout: 10000,

    // Set default timeout for navigation
    navigationTimeout: 30000,
  },

  // Configure test timeout
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Projects for different browsers
  projects: [
    // Setup project for authentication
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },

    // Mobile browsers
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
      dependencies: ["setup"],
    },
  ],

  // Output directory for test artifacts
  outputDir: "test-results/",
};

/**
 * Create a Playwright config with app-specific overrides
 *
 * @param overrides - Configuration overrides
 * @returns Complete Playwright configuration
 *
 * @example
 * ```ts
 * export default createPlaywrightConfig({
 *   testDir: './e2e',
 *   use: {
 *     baseURL: 'http://localhost:3101',
 *   },
 *   webServer: {
 *     command: 'yarn dev',
 *     url: 'http://localhost:3101',
 *   },
 * });
 * ```
 */
export function createPlaywrightConfig(overrides: Partial<PlaywrightTestConfig> = {}): PlaywrightTestConfig {
  return defineConfig({
    ...basePlaywrightConfig,
    ...overrides,
    use: {
      ...basePlaywrightConfig.use,
      ...overrides.use,
    },
  });
}

// Default export
export default basePlaywrightConfig;

// Re-export Playwright utilities
export { defineConfig, devices };
export type { PlaywrightTestConfig };
