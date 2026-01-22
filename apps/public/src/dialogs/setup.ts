/**
 * Public App Dialog Setup
 * 
 * This file registers all dialogs for the public app.
 * Dialogs are registered here and initialized in the app's root layout.
 * 
 * To add a new dialog:
 * 1. Create your dialog component in src/dialogs/components/
 * 2. Import it here
 * 3. Add it to the dialogs object (eager load) or use registerLazy (lazy load)
 */

import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
import type { DialogComponentMap } from "@buildbase/dialog-manager";
import { PUBLIC_DIALOG_KEYS } from "./constants";

/**
 * Define your app's dialog component map type
 * This provides type safety when registering dialogs
 */
/**
 * Define your app's dialog component map type.
 * Use PUBLIC_DIALOG_KEYS constants for the keys to ensure consistency.
 * 
 * @example
 * ```ts
 * export type PublicAppDialogs = {
 *   [PUBLIC_DIALOG_KEYS.CONTACT]: typeof ContactDialog;
 *   [PUBLIC_DIALOG_KEYS.NEWSLETTER]: typeof NewsletterDialog;
 * } & DialogComponentMap;
 * ```
 */
export type PublicAppDialogs = {
  // Add your dialog keys here using PUBLIC_DIALOG_KEYS constants
  // Example:
  // [PUBLIC_DIALOG_KEYS.CONTACT]: typeof ContactDialog;
  // [PUBLIC_DIALOG_KEYS.NEWSLETTER]: typeof NewsletterDialog;
} & DialogComponentMap;

/**
 * Setup dialogs for the public app
 * This function should be called once when the app initializes
 */
export function setupPublicDialogs() {
  // Register frequently used dialogs (eager load)
  // These dialogs are loaded immediately when the app starts
  setupAppDialogs<PublicAppDialogs>({
    dialogs: {
      // Add your frequently used dialogs here using PUBLIC_DIALOG_KEYS constants
      // Example:
      // [PUBLIC_DIALOG_KEYS.CONTACT]: ContactDialog,
      // [PUBLIC_DIALOG_KEYS.NEWSLETTER]: NewsletterDialog,
    },
    initializeCommon: true, // Initialize confirmation & alert dialogs
  });

  // Register lazy-loaded dialogs (loaded on-demand)
  // These dialogs are only loaded when first opened
  // Use this for heavy or rarely-used dialogs
  // Example:
  // dialogRegistry.registerLazy(
  //   "public:advanced-search",
  //   createLazyDialogLoader(() => import("./components/AdvancedSearchDialog"))
  // );
}
