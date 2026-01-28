/**
 * Base Page Object Model
 *
 * Abstract base class for Page Object Models.
 * Provides common functionality for all page objects.
 *
 * @example
 * ```ts
 * import { BasePage } from '@buildbase/testing/e2e/pages';
 *
 * export class DashboardPage extends BasePage {
 *   readonly url = '/dashboard';
 *
 *   get welcomeMessage() {
 *     return this.page.getByTestId('welcome-message');
 *   }
 *
 *   async createItem(name: string) {
 *     await this.page.getByRole('button', { name: 'Create' }).click();
 *     await this.page.getByLabel('Name').fill(name);
 *     await this.page.getByRole('button', { name: 'Save' }).click();
 *   }
 * }
 * ```
 */

import type { Page, Locator } from "@playwright/test";

/**
 * Abstract base class for all page objects
 */
export abstract class BasePage {
  /**
   * Playwright Page instance
   */
  protected readonly page: Page;

  /**
   * Page URL (relative to baseURL)
   * Must be implemented by subclasses
   */
  abstract readonly url: string;

  constructor(page: Page) {
    this.page = page;
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  /**
   * Navigate to this page
   *
   * @param options - Navigation options
   */
  async goto(options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle" }) {
    await this.page.goto(this.url, options);
  }

  /**
   * Navigate to a specific path relative to this page
   *
   * @param path - Relative path
   */
  async navigateTo(path: string) {
    await this.page.goto(`${this.url}${path}`);
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState("load");
  }

  // ============================================================================
  // Page Information
  // ============================================================================

  /**
   * Get the page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get the current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Check if current URL matches expected pattern
   *
   * @param pattern - URL pattern (string or regex)
   */
  async expectUrl(pattern: string | RegExp): Promise<void> {
    const { expect } = await import("@playwright/test");
    await expect(this.page).toHaveURL(pattern);
  }

  // ============================================================================
  // Element Waiting
  // ============================================================================

  /**
   * Wait for an element to be visible
   *
   * @param selector - CSS selector or locator
   * @param timeout - Timeout in milliseconds
   */
  async waitForSelector(selector: string, timeout = 30000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    return locator;
  }

  /**
   * Wait for an element to be hidden
   *
   * @param selector - CSS selector
   * @param timeout - Timeout in milliseconds
   */
  async waitForSelectorHidden(selector: string, timeout = 30000): Promise<void> {
    await this.page.locator(selector).waitFor({ state: "hidden", timeout });
  }

  /**
   * Wait for text to appear on page
   *
   * @param text - Text to wait for
   * @param timeout - Timeout in milliseconds
   */
  async waitForText(text: string, timeout = 30000): Promise<void> {
    await this.page.getByText(text).waitFor({ state: "visible", timeout });
  }

  // ============================================================================
  // Common Actions
  // ============================================================================

  /**
   * Click an element by role
   *
   * @param role - ARIA role
   * @param options - Locator options
   */
  async clickByRole(
    role: "button" | "link" | "checkbox" | "radio" | "textbox" | "menuitem",
    options?: { name?: string | RegExp }
  ): Promise<void> {
    await this.page.getByRole(role, options).click();
  }

  /**
   * Fill an input by label
   *
   * @param label - Input label
   * @param value - Value to fill
   */
  async fillByLabel(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Fill an input by placeholder
   *
   * @param placeholder - Input placeholder
   * @param value - Value to fill
   */
  async fillByPlaceholder(placeholder: string, value: string): Promise<void> {
    await this.page.getByPlaceholder(placeholder).fill(value);
  }

  /**
   * Click an element by test ID
   *
   * @param testId - data-testid value
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.page.getByTestId(testId).click();
  }

  // ============================================================================
  // Screenshots
  // ============================================================================

  /**
   * Take a screenshot of the page
   *
   * @param name - Screenshot name
   */
  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Take a full page screenshot
   *
   * @param name - Screenshot name
   */
  async fullPageScreenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Wait for a specific amount of time (use sparingly)
   *
   * @param ms - Milliseconds to wait
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Reload the page
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
  }
}

export default BasePage;
