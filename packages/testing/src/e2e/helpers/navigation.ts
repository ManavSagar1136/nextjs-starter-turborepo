/**
 * Navigation Helpers
 *
 * Utility functions for common navigation patterns in E2E tests.
 *
 * @example
 * ```ts
 * import { gotoAndWait, waitForNavigation } from '@buildbase/testing/e2e/helpers';
 *
 * test('navigation', async ({ page }) => {
 *   await gotoAndWait(page, '/dashboard');
 *   await clickAndWaitForNavigation(page, 'Settings');
 * });
 * ```
 */

import type { Page } from "@playwright/test";

/**
 * Navigate to URL and wait for network to be idle
 *
 * @param page - Playwright page
 * @param url - URL to navigate to
 * @param options - Navigation options
 */
export async function gotoAndWait(
  page: Page,
  url: string,
  options?: {
    waitUntil?: "load" | "domcontentloaded" | "networkidle";
    timeout?: number;
  }
): Promise<void> {
  const { waitUntil = "networkidle", timeout = 30000 } = options ?? {};
  await page.goto(url, { waitUntil, timeout });
}

/**
 * Click element and wait for navigation to complete
 *
 * @param page - Playwright page
 * @param selector - Element selector or text
 * @param options - Options
 */
export async function clickAndWaitForNavigation(
  page: Page,
  selector: string,
  options?: {
    byRole?: "link" | "button" | "menuitem";
    timeout?: number;
  }
): Promise<void> {
  const { byRole = "link", timeout = 30000 } = options ?? {};

  await Promise.all([page.waitForNavigation({ timeout }), page.getByRole(byRole, { name: selector }).click()]);
}

/**
 * Wait for URL to match pattern
 *
 * @param page - Playwright page
 * @param pattern - URL pattern (string or regex)
 * @param timeout - Timeout in ms
 */
export async function waitForUrl(page: Page, pattern: string | RegExp, timeout = 30000): Promise<void> {
  await page.waitForURL(pattern, { timeout });
}

/**
 * Refresh page and wait for load
 *
 * @param page - Playwright page
 */
export async function refreshAndWait(page: Page): Promise<void> {
  await page.reload({ waitUntil: "networkidle" });
}

/**
 * Go back and wait for navigation
 *
 * @param page - Playwright page
 */
export async function goBackAndWait(page: Page): Promise<void> {
  await Promise.all([page.waitForNavigation(), page.goBack()]);
}

/**
 * Wait for page to be fully loaded
 *
 * @param page - Playwright page
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Check if current URL matches pattern
 *
 * @param page - Playwright page
 * @param pattern - URL pattern
 */
export function urlMatches(page: Page, pattern: string | RegExp): boolean {
  const url = page.url();
  if (typeof pattern === "string") {
    return url.includes(pattern);
  }
  return pattern.test(url);
}

export default {
  gotoAndWait,
  clickAndWaitForNavigation,
  waitForUrl,
  refreshAndWait,
  goBackAndWait,
  waitForPageReady,
  urlMatches,
};
