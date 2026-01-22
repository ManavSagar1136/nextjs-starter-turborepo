/**
 * User App Dialog Setup
 *
 * This file registers all dialogs for the user app.
 * Dialogs are registered here and initialized in the app's root layout.
 *
 * To add a new dialog:
 * 1. Create your dialog component in src/dialogs/components/
 * 2. Import it here
 * 3. Add it to the dialogs object (eager load) or use registerLazy (lazy load)
 */

import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
// import { dialogRegistry } from "@buildbase/dialog-manager/registry";
import type { DialogComponentMap } from "@buildbase/dialog-manager";
// import { USER_DIALOG_KEYS } from "./constants";

/**
 * Define your app's dialog component map type.
 * Use USER_DIALOG_KEYS constants for the keys to ensure consistency.
 *
 * @example
 * ```ts
 * export type UserAppDialogs = {
 *   [USER_DIALOG_KEYS.CREATE]: typeof CreateUserDialog;
 *   [USER_DIALOG_KEYS.EDIT]: typeof EditUserDialog;
 * } & DialogComponentMap;
 * ```
 */
export type UserAppDialogs = {
  // Add your dialog keys here using USER_DIALOG_KEYS constants
  // Example:
  // [USER_DIALOG_KEYS.CREATE]: typeof CreateUserDialog;
  // [USER_DIALOG_KEYS.EDIT]: typeof EditUserDialog;
} & DialogComponentMap;

/**
 * Setup dialogs for the user app
 * This function should be called once when the app initializes
 */
export function setupUserDialogs() {
  // Register frequently used dialogs (eager load)
  // These dialogs are loaded immediately when the app starts
  setupAppDialogs<UserAppDialogs>({
    dialogs: {
      // Add your frequently used dialogs here using USER_DIALOG_KEYS constants
      // Example:
      // [USER_DIALOG_KEYS.CREATE]: CreateUserDialog,
      // [USER_DIALOG_KEYS.EDIT]: EditUserDialog,
    },
    initializeCommon: true, // Initialize confirmation & alert dialogs
  });

  // Register lazy-loaded dialogs (loaded on-demand)
  // These dialogs are only loaded when first opened
  // Use this for heavy or rarely-used dialogs
  // Example:
  // dialogRegistry.registerLazy(
  //   "user:bulk-import",
  //   createLazyDialogLoader(() => import("./components/BulkImportDialog"))
  // );
}
