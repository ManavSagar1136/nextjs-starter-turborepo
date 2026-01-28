/**
 * Dashboard Page Object Model
 *
 * Generic dashboard page POM that can be extended for specific implementations.
 *
 * @example
 * ```ts
 * import { DashboardPage } from '@buildbase/testing/e2e/pages';
 *
 * test('dashboard shows welcome message', async ({ page }) => {
 *   const dashboard = new DashboardPage(page);
 *   await dashboard.goto();
 *   await expect(dashboard.welcomeMessage).toBeVisible();
 * });
 * ```
 */

import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class DashboardPage extends BasePage {
  readonly url = "/dashboard";

  // ============================================================================
  // Locators - Header
  // ============================================================================

  /**
   * Main header/navigation
   */
  get header(): Locator {
    return this.page.getByRole("banner");
  }

  /**
   * User avatar/profile button
   */
  get userAvatar(): Locator {
    return this.page.getByTestId("user-avatar");
  }

  /**
   * User menu dropdown
   */
  get userMenu(): Locator {
    return this.page.getByRole("menu", { name: /user menu/i });
  }

  /**
   * Logout button in user menu
   */
  get logoutButton(): Locator {
    return this.page.getByRole("menuitem", { name: /log out|sign out/i });
  }

  /**
   * Workspace selector
   */
  get workspaceSelector(): Locator {
    return this.page.getByTestId("workspace-selector");
  }

  // ============================================================================
  // Locators - Sidebar
  // ============================================================================

  /**
   * Sidebar navigation
   */
  get sidebar(): Locator {
    return this.page.getByRole("navigation", { name: /sidebar|main/i });
  }

  /**
   * Get sidebar navigation link by name
   */
  getSidebarLink(name: string | RegExp): Locator {
    return this.sidebar.getByRole("link", { name });
  }

  // ============================================================================
  // Locators - Main Content
  // ============================================================================

  /**
   * Main content area
   */
  get mainContent(): Locator {
    return this.page.getByRole("main");
  }

  /**
   * Welcome message
   */
  get welcomeMessage(): Locator {
    return this.page.getByTestId("welcome-message");
  }

  /**
   * Page title
   */
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  /**
   * Create/Add button (primary action)
   */
  get createButton(): Locator {
    return this.page.getByRole("button", { name: /create|add|new/i });
  }

  /**
   * Search input
   */
  get searchInput(): Locator {
    return this.page.getByRole("searchbox");
  }

  // ============================================================================
  // Locators - Notifications
  // ============================================================================

  /**
   * Notification bell/icon
   */
  get notificationBell(): Locator {
    return this.page.getByTestId("notification-bell");
  }

  /**
   * Notification badge count
   */
  get notificationBadge(): Locator {
    return this.page.getByTestId("notification-badge");
  }

  // ============================================================================
  // Actions - Navigation
  // ============================================================================

  /**
   * Navigate to a section via sidebar
   *
   * @param section - Section name
   */
  async navigateToSection(section: string): Promise<void> {
    await this.getSidebarLink(section).click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to settings
   */
  async goToSettings(): Promise<void> {
    await this.navigateToSection("Settings");
  }

  /**
   * Navigate to profile
   */
  async goToProfile(): Promise<void> {
    await this.userAvatar.click();
    await this.page.getByRole("menuitem", { name: /profile/i }).click();
  }

  // ============================================================================
  // Actions - Workspace
  // ============================================================================

  /**
   * Select a workspace
   *
   * @param workspaceName - Name of workspace to select
   */
  async selectWorkspace(workspaceName: string): Promise<void> {
    await this.workspaceSelector.click();
    await this.page.getByRole("option", { name: workspaceName }).click();
    await this.waitForPageLoad();
  }

  /**
   * Get current workspace name
   */
  async getCurrentWorkspace(): Promise<string> {
    const text = await this.workspaceSelector.textContent();
    return text ?? "";
  }

  // ============================================================================
  // Actions - Search
  // ============================================================================

  /**
   * Search for content
   *
   * @param query - Search query
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }

  // ============================================================================
  // Actions - User
  // ============================================================================

  /**
   * Open user menu
   */
  async openUserMenu(): Promise<void> {
    await this.userAvatar.click();
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  // ============================================================================
  // Actions - Notifications
  // ============================================================================

  /**
   * Open notifications panel
   */
  async openNotifications(): Promise<void> {
    await this.notificationBell.click();
  }

  /**
   * Get notification count
   */
  async getNotificationCount(): Promise<number> {
    const badge = await this.notificationBadge.textContent();
    return badge ? parseInt(badge, 10) : 0;
  }

  // ============================================================================
  // Assertions
  // ============================================================================

  /**
   * Expect welcome message to be visible
   */
  async expectWelcomeMessage(): Promise<void> {
    const { expect } = await import("@playwright/test");
    await expect(this.welcomeMessage).toBeVisible();
  }

  /**
   * Expect page title
   *
   * @param title - Expected title
   */
  async expectPageTitle(title: string | RegExp): Promise<void> {
    const { expect } = await import("@playwright/test");
    await expect(this.pageTitle).toContainText(title);
  }

  /**
   * Expect sidebar link to be active
   *
   * @param name - Link name
   */
  async expectSidebarActive(name: string): Promise<void> {
    const { expect } = await import("@playwright/test");
    const link = this.getSidebarLink(name);
    await expect(link).toHaveAttribute("aria-current", "page");
  }
}

export default DashboardPage;
