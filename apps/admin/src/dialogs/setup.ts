/**
 * Admin App Dialog Setup
 *
 * This file registers all dialogs for the admin app.
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
// import { ADMIN_DIALOG_KEYS } from "./constants";

/**
 * Define your app's dialog component map type.
 * Use ADMIN_DIALOG_KEYS constants for the keys to ensure consistency.
 *
 * @example
 * ```ts
 * export type AdminAppDialogs = {
 *   [ADMIN_DIALOG_KEYS.CREATE_USER]: typeof CreateUserDialog;
 *   [ADMIN_DIALOG_KEYS.EDIT_USER]: typeof EditUserDialog;
 * } & DialogComponentMap;
 * ```
 */
export type AdminAppDialogs = {
  // Add your dialog keys here using ADMIN_DIALOG_KEYS constants
  // Example:
  // [ADMIN_DIALOG_KEYS.CREATE_USER]: typeof CreateUserDialog;
  // [ADMIN_DIALOG_KEYS.EDIT_USER]: typeof EditUserDialog;
} & DialogComponentMap;

/**
 * Setup dialogs for the admin app
 * This function should be called once when the app initializes
 */
export function setupAdminDialogs() {
  // Register frequently used dialogs (eager load)
  // These dialogs are loaded immediately when the app starts
  setupAppDialogs<AdminAppDialogs>({
    dialogs: {
      // Add your frequently used dialogs here using ADMIN_DIALOG_KEYS constants
      // Example:
      // [ADMIN_DIALOG_KEYS.CREATE_USER]: CreateUserDialog,
      // [ADMIN_DIALOG_KEYS.EDIT_USER]: EditUserDialog,
    },
    initializeCommon: true, // Initialize confirmation & alert dialogs
  });

  // Register lazy-loaded dialogs (loaded on-demand)
  // These dialogs are only loaded when first opened
  // Use this for heavy or rarely-used dialogs
  // Example:
  // dialogRegistry.registerLazy(
  //   "admin:bulk-operations",
  //   createLazyDialogLoader(() => import("./components/BulkOperationsDialog"))
  // );
}
