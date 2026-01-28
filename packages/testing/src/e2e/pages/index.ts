/**
 * Page Object Models
 *
 * Re-exports all page object models for E2E testing.
 *
 * @example
 * ```ts
 * import { BasePage, LoginPage, DashboardPage } from '@buildbase/testing/e2e/pages';
 *
 * // Create custom page
 * class MyPage extends BasePage {
 *   readonly url = '/my-page';
 * }
 *
 * // Use built-in pages
 * const login = new LoginPage(page);
 * const dashboard = new DashboardPage(page);
 * ```
 */

export { BasePage, default as BasePageDefault } from "./base.page";
export { LoginPage, default as LoginPageDefault } from "./login.page";
export { DashboardPage, default as DashboardPageDefault } from "./dashboard.page";

// Re-export types
export type { Page, Locator } from "@playwright/test";
