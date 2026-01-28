/**
 * Auth State Fixture
 *
 * Playwright fixture for managing authenticated state.
 * Stores auth state to avoid re-login for each test.
 *
 * @example
 * ```ts
 * // In your app's e2e/auth.setup.ts
 * import { test as setup } from '@playwright/test';
 * import { AUTH_FILE } from '@buildbase/testing/e2e/fixtures';
 *
 * setup('authenticate', async ({ page }) => {
 *   await page.goto('/login');
 *   await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
 *   await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
 *   await page.getByRole('button', { name: 'Sign in' }).click();
 *   await page.waitForURL('/dashboard');
 *   await page.context().storageState({ path: AUTH_FILE });
 * });
 *
 * // In your app's playwright.config.ts
 * import { AUTH_FILE } from '@buildbase/testing/e2e/fixtures';
 *
 * export default defineConfig({
 *   projects: [
 *     { name: 'setup', testMatch: /.*\.setup\.ts/ },
 *     {
 *       name: 'chromium',
 *       use: {
 *         storageState: AUTH_FILE,
 *       },
 *       dependencies: ['setup'],
 *     },
 *   ],
 * });
 * ```
 */

import { test as base, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ============================================================================
// Constants
// ============================================================================

/**
 * Default path for storing auth state
 */
export const AUTH_FILE = "playwright/.auth/user.json";

/**
 * Admin auth state file
 */
export const ADMIN_AUTH_FILE = "playwright/.auth/admin.json";

// ============================================================================
// Types
// ============================================================================

export interface AuthFixtures {
  /**
   * Page with authenticated user
   */
  authenticatedPage: Page;

  /**
   * Page with admin user
   */
  adminPage: Page;

  /**
   * Save current auth state
   */
  saveAuthState: (filePath?: string) => Promise<void>;

  /**
   * Clear auth state
   */
  clearAuthState: (filePath?: string) => Promise<void>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensure the auth directory exists
 */
function ensureAuthDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Check if auth state file exists and is valid
 */
export function hasAuthState(filePath = AUTH_FILE): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, "utf-8");
    const state = JSON.parse(content);
    return state && (state.cookies?.length > 0 || state.origins?.length > 0);
  } catch {
    return false;
  }
}

/**
 * Clear auth state file
 */
export function clearAuthStateFile(filePath = AUTH_FILE): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// ============================================================================
// Extended Test Fixture
// ============================================================================

/**
 * Extended test with auth fixtures
 *
 * @example
 * ```ts
 * import { test } from '@buildbase/testing/e2e/fixtures';
 *
 * test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/dashboard');
 *   await expect(authenticatedPage).toHaveURL('/dashboard');
 * });
 * ```
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Create context with stored auth state
    const context = await browser.newContext({
      storageState: hasAuthState(AUTH_FILE) ? AUTH_FILE : undefined,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    // Create context with admin auth state
    const context = await browser.newContext({
      storageState: hasAuthState(ADMIN_AUTH_FILE) ? ADMIN_AUTH_FILE : undefined,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  saveAuthState: async ({ page }, use) => {
    const save = async (filePath = AUTH_FILE) => {
      ensureAuthDir(filePath);
      await page.context().storageState({ path: filePath });
    };
    await use(save);
  },

  clearAuthState: async (_, use) => {
    const clear = async (filePath = AUTH_FILE) => {
      clearAuthStateFile(filePath);
    };
    await use(clear);
  },
});

// ============================================================================
// Setup Helpers
// ============================================================================

/**
 * Create auth setup test
 *
 * @example
 * ```ts
 * // e2e/auth.setup.ts
 * import { createAuthSetup } from '@buildbase/testing/e2e/fixtures';
 *
 * createAuthSetup({
 *   loginUrl: '/login',
 *   email: process.env.TEST_USER_EMAIL!,
 *   password: process.env.TEST_USER_PASSWORD!,
 *   successUrl: '/dashboard',
 * });
 * ```
 */
export interface AuthSetupOptions {
  loginUrl: string;
  email: string;
  password: string;
  successUrl: string | RegExp;
  emailSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
  authFile?: string;
}

/**
 * Create a standard auth setup test
 */
export function createAuthSetup(options: AuthSetupOptions) {
  const {
    loginUrl,
    email,
    password,
    successUrl,
    emailSelector = "Email",
    passwordSelector = "Password",
    submitSelector = "Sign in",
    authFile = AUTH_FILE,
  } = options;

  return base("authenticate", async ({ page }) => {
    await page.goto(loginUrl);
    await page.getByLabel(emailSelector).fill(email);
    await page.getByLabel(passwordSelector).fill(password);
    await page.getByRole("button", { name: submitSelector }).click();
    await page.waitForURL(successUrl);
    ensureAuthDir(authFile);
    await page.context().storageState({ path: authFile });
  });
}

// Re-export base test and expect
export { expect } from "@playwright/test";

// Default export
export default test;
