/**
 * E2E Test Fixtures
 *
 * Re-exports all Playwright fixtures for E2E testing.
 *
 * @example
 * ```ts
 * import { test, expect, AUTH_FILE } from '@buildbase/testing/e2e/fixtures';
 *
 * test('authenticated test', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/dashboard');
 *   await expect(authenticatedPage).toHaveURL('/dashboard');
 * });
 * ```
 */

export {
  test,
  expect,
  AUTH_FILE,
  ADMIN_AUTH_FILE,
  hasAuthState,
  clearAuthStateFile,
  createAuthSetup,
  type AuthFixtures,
  type AuthSetupOptions,
} from "./auth.fixture";
