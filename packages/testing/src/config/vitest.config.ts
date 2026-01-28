/**
 * Shared Vitest configuration for the BuildBase NextJS Starter
 *
 * Usage in packages/apps:
 * ```ts
 * // vitest.config.ts
 * import { defineConfig, mergeConfig } from 'vitest/config';
 * import sharedConfig from '@buildbase/testing/config/vitest';
 *
 * export default mergeConfig(sharedConfig, defineConfig({
 *   // package-specific overrides
 * }));
 * ```
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export const sharedVitestConfig = defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Enable globals (describe, it, expect, vi)
    globals: true,

    // Use happy-dom for faster DOM testing
    environment: "happy-dom",

    // Include patterns
    include: ["**/*.{test,spec}.{ts,tsx}"],

    // Exclude patterns
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**", "**/.next/**"],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mocks/**",
        "**/fixtures/**",
        "**/__tests__/**",
        "**/*.test.*",
        "**/*.spec.*",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },

    // Reporter options
    reporters: ["default"],

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,
  },
});

export default sharedVitestConfig;

// Export types for consumers
export type { UserConfig } from "vitest/config";
