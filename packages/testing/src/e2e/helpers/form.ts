/**
 * Form Helpers
 *
 * Utility functions for interacting with forms in E2E tests.
 *
 * @example
 * ```ts
 * import { fillForm, submitForm } from '@buildbase/testing/e2e/helpers';
 *
 * test('form submission', async ({ page }) => {
 *   await fillForm(page, {
 *     'Email': 'user@example.com',
 *     'Password': 'secret123',
 *   });
 *   await submitForm(page);
 * });
 * ```
 */

import type { Page, Locator } from "@playwright/test";

/**
 * Field configuration for form filling
 */
export interface FormField {
  /**
   * Label, placeholder, or test ID
   */
  selector: string;

  /**
   * Value to fill
   */
  value: string;

  /**
   * How to find the field
   */
  by?: "label" | "placeholder" | "testid" | "role";

  /**
   * Field type
   */
  type?: "text" | "select" | "checkbox" | "radio";
}

/**
 * Fill a form with multiple fields
 *
 * @param page - Playwright page
 * @param fields - Object mapping labels to values
 *
 * @example
 * ```ts
 * await fillForm(page, {
 *   'Email': 'user@example.com',
 *   'Name': 'John Doe',
 * });
 * ```
 */
export async function fillForm(page: Page, fields: Record<string, string>): Promise<void> {
  for (const [label, value] of Object.entries(fields)) {
    await page.getByLabel(label).fill(value);
  }
}

/**
 * Fill form with advanced field configuration
 *
 * @param page - Playwright page
 * @param fields - Array of field configurations
 *
 * @example
 * ```ts
 * await fillFormAdvanced(page, [
 *   { selector: 'Email', value: 'user@example.com', by: 'label' },
 *   { selector: 'country', value: 'US', by: 'testid', type: 'select' },
 *   { selector: 'newsletter', value: 'true', by: 'label', type: 'checkbox' },
 * ]);
 * ```
 */
export async function fillFormAdvanced(page: Page, fields: FormField[]): Promise<void> {
  for (const field of fields) {
    const { selector, value, by = "label", type = "text" } = field;

    let locator: Locator;

    // Find the field
    switch (by) {
      case "label":
        locator = page.getByLabel(selector);
        break;
      case "placeholder":
        locator = page.getByPlaceholder(selector);
        break;
      case "testid":
        locator = page.getByTestId(selector);
        break;
      case "role":
        locator = page.getByRole("textbox", { name: selector });
        break;
    }

    // Fill based on type
    switch (type) {
      case "text":
        await locator.fill(value);
        break;
      case "select":
        await locator.selectOption(value);
        break;
      case "checkbox":
        if (value === "true") {
          await locator.check();
        } else {
          await locator.uncheck();
        }
        break;
      case "radio":
        await locator.check();
        break;
    }
  }
}

/**
 * Submit a form
 *
 * @param page - Playwright page
 * @param submitText - Submit button text (default: 'Submit')
 */
export async function submitForm(page: Page, submitText: string | RegExp = /submit|save|create|send/i): Promise<void> {
  await page.getByRole("button", { name: submitText }).click();
}

/**
 * Submit form and wait for navigation
 *
 * @param page - Playwright page
 * @param submitText - Submit button text
 * @param expectedUrl - Expected URL after submit
 */
export async function submitFormAndWait(
  page: Page,
  submitText: string | RegExp = /submit|save|create/i,
  expectedUrl?: string | RegExp
): Promise<void> {
  const submitPromise = page.getByRole("button", { name: submitText }).click();

  if (expectedUrl) {
    await Promise.all([page.waitForURL(expectedUrl), submitPromise]);
  } else {
    await Promise.all([page.waitForNavigation(), submitPromise]);
  }
}

/**
 * Clear a form field
 *
 * @param page - Playwright page
 * @param label - Field label
 */
export async function clearField(page: Page, label: string): Promise<void> {
  await page.getByLabel(label).clear();
}

/**
 * Clear all form fields
 *
 * @param page - Playwright page
 * @param labels - Array of field labels
 */
export async function clearForm(page: Page, labels: string[]): Promise<void> {
  for (const label of labels) {
    await page.getByLabel(label).clear();
  }
}

/**
 * Get form field value
 *
 * @param page - Playwright page
 * @param label - Field label
 */
export async function getFieldValue(page: Page, label: string): Promise<string> {
  return page.getByLabel(label).inputValue();
}

/**
 * Check if form has validation error
 *
 * @param page - Playwright page
 * @param fieldLabel - Field label to check
 */
export async function hasFieldError(page: Page, fieldLabel: string): Promise<boolean> {
  const field = page.getByLabel(fieldLabel);
  const ariaInvalid = await field.getAttribute("aria-invalid");
  return ariaInvalid === "true";
}

/**
 * Get validation error message for a field
 *
 * @param page - Playwright page
 * @param fieldLabel - Field label
 */
export async function getFieldError(page: Page, fieldLabel: string): Promise<string | null> {
  const field = page.getByLabel(fieldLabel);
  const errorId = await field.getAttribute("aria-errormessage");
  if (errorId) {
    const errorElement = page.locator(`#${errorId}`);
    return errorElement.textContent();
  }

  // Try to find error by proximity
  const fieldContainer = field.locator("..");
  const error = fieldContainer.locator('[role="alert"], .error, .field-error');
  if (await error.isVisible()) {
    return error.textContent();
  }

  return null;
}

export default {
  fillForm,
  fillFormAdvanced,
  submitForm,
  submitFormAndWait,
  clearField,
  clearForm,
  getFieldValue,
  hasFieldError,
  getFieldError,
};
