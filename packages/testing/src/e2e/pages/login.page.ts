/**
 * Login Page Object Model
 *
 * Generic login page POM that can be extended for specific implementations.
 *
 * @example
 * ```ts
 * import { LoginPage } from '@buildbase/testing/e2e/pages';
 *
 * test('user can login', async ({ page }) => {
 *   const loginPage = new LoginPage(page);
 *   await loginPage.goto();
 *   await loginPage.login('user@example.com', 'password123');
 *   await expect(page).toHaveURL('/dashboard');
 * });
 * ```
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  readonly url = "/login";

  // ============================================================================
  // Locators
  // ============================================================================

  /**
   * Email input field
   */
  get emailInput(): Locator {
    return this.page.getByLabel(/email/i);
  }

  /**
   * Password input field
   */
  get passwordInput(): Locator {
    return this.page.getByLabel(/password/i);
  }

  /**
   * Submit/Sign in button
   */
  get submitButton(): Locator {
    return this.page.getByRole("button", { name: /sign in|log in|submit/i });
  }

  /**
   * Error message container
   */
  get errorMessage(): Locator {
    return this.page.getByRole("alert");
  }

  /**
   * "Forgot password" link
   */
  get forgotPasswordLink(): Locator {
    return this.page.getByRole("link", { name: /forgot password/i });
  }

  /**
   * "Sign up" link
   */
  get signUpLink(): Locator {
    return this.page.getByRole("link", { name: /sign up|register|create account/i });
  }

  /**
   * "Remember me" checkbox
   */
  get rememberMeCheckbox(): Locator {
    return this.page.getByRole("checkbox", { name: /remember me/i });
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Fill the email field
   *
   * @param email - Email address
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill the password field
   *
   * @param password - Password
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the submit button
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Perform complete login flow
   *
   * @param email - Email address
   * @param password - Password
   * @param options - Additional options
   */
  async login(email: string, password: string, options?: { rememberMe?: boolean }): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);

    if (options?.rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.submit();
  }

  /**
   * Login and wait for navigation to complete
   *
   * @param email - Email address
   * @param password - Password
   * @param expectedUrl - Expected URL after login
   */
  async loginAndWait(email: string, password: string, expectedUrl: string | RegExp = "/dashboard"): Promise<void> {
    await this.login(email, password);
    await this.expectUrl(expectedUrl);
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Navigate to sign up page
   */
  async goToSignUp(): Promise<void> {
    await this.signUpLink.click();
  }

  // ============================================================================
  // Assertions
  // ============================================================================

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    const text = await this.errorMessage.textContent();
    return text ?? "";
  }

  /**
   * Expect error message to contain text
   *
   * @param text - Expected text
   */
  async expectError(text: string | RegExp): Promise<void> {
    const { expect } = await import("@playwright/test");
    await expect(this.errorMessage).toContainText(text);
  }

  /**
   * Expect no error message
   */
  async expectNoError(): Promise<void> {
    const { expect } = await import("@playwright/test");
    await expect(this.errorMessage).not.toBeVisible();
  }
}

export default LoginPage;
