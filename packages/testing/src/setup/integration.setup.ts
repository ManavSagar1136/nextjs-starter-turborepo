/**
 * Integration Test Setup File
 *
 * This file runs before integration tests to set up MSW and extended timeouts.
 * Include it in your vitest.config.ts setupFiles array for integration tests.
 *
 * @example
 * ```ts
 * // vitest.config.integration.ts
 * export default defineConfig({
 *   test: {
 *     setupFiles: ['@buildbase/testing/setup/integration'],
 *     testTimeout: 30000,
 *   },
 * });
 * ```
 */

import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { server } from "../mocks/http.mock";

// ============================================================================
// MSW Server Setup
// ============================================================================

/**
 * Start MSW server before all tests
 * - onUnhandledRequest: 'error' ensures all requests are explicitly handled
 */
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  });
});

/**
 * Reset handlers after each test
 * - Clears any test-specific handlers
 * - Restores default handlers
 */
afterEach(() => {
  server.resetHandlers();
});

/**
 * Close MSW server after all tests
 */
afterAll(() => {
  server.close();
});

// ============================================================================
// Extended Timeouts for Integration Tests
// ============================================================================

/**
 * Default timeout for integration tests (30 seconds)
 * Can be overridden per-test with test.timeout()
 */
vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 30000,
});

// ============================================================================
// Additional Integration Test Utilities
// ============================================================================

/**
 * Wait for network requests to complete
 *
 * @param ms - Time to wait in milliseconds
 */
export const waitForNetwork = (ms = 100): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Flush all pending promises
 */
export const flushPromises = (): Promise<void> => new Promise(resolve => setImmediate(resolve));

// ============================================================================
// Console Spy Setup (Optional)
// ============================================================================

/**
 * Spy on console methods for testing error handling
 */
export const consoleSpy = {
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  log: vi.spyOn(console, "log").mockImplementation(() => {}),

  /**
   * Restore all console spies
   */
  restore: () => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.log.mockRestore();
  },

  /**
   * Clear all console spy call history
   */
  clear: () => {
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.log.mockClear();
  },
};

// Restore console at end of tests
afterAll(() => {
  consoleSpy.restore();
});

// ============================================================================
// Export setup status
// ============================================================================

export const INTEGRATION_SETUP_VERSION = "1.0.0";

/**
 * Re-export MSW utilities for convenience
 */
export { server } from "../mocks/http.mock";
