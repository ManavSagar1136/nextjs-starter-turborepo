/**
 * E2E Test Helpers
 *
 * Re-exports all helper utilities for E2E testing.
 *
 * @example
 * ```ts
 * import {
 *   gotoAndWait,
 *   fillForm,
 *   submitForm,
 * } from '@buildbase/testing/e2e/helpers';
 * ```
 */

// Navigation helpers
export {
  gotoAndWait,
  clickAndWaitForNavigation,
  waitForUrl,
  refreshAndWait,
  goBackAndWait,
  waitForPageReady,
  urlMatches,
  default as navigationHelpers,
} from "./navigation";

// Form helpers
export {
  fillForm,
  fillFormAdvanced,
  submitForm,
  submitFormAndWait,
  clearField,
  clearForm,
  getFieldValue,
  hasFieldError,
  getFieldError,
  default as formHelpers,
  type FormField,
} from "./form";
