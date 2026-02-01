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
import { MEDIA_LIBRARY_DIALOG_KEYS, MediaUploadDialog } from "@buildbase/dialog-manager";
import type { DialogComponentMap } from "@buildbase/dialog-manager";
import type { MediaUploadDialogProps } from "@buildbase/dialog-manager";
import React from "react";

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
  // Media library dialogs
  [MEDIA_LIBRARY_DIALOG_KEYS.MEDIA_UPLOAD]: React.ComponentType<MediaUploadDialogProps>;
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
      // Media/Asset upload dialog - reusable across admin app
      [MEDIA_LIBRARY_DIALOG_KEYS.MEDIA_UPLOAD]: MediaUploadDialog as any,
    },
    initializeCommon: true, // Initialize confirmation & alert dialogs
  });
}
