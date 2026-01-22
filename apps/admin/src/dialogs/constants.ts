/**
 * Dialog Keys Constants
 *
 * This file contains all dialog keys for the admin app.
 * Use these constants instead of hardcoding strings to ensure type safety
 * and avoid typos. All dialog keys should be defined here.
 *
 * Naming convention: Use the format "app:feature" (e.g., "admin:create-user")
 */

/**
 * Admin app dialog keys.
 * Add new dialog keys here as you create new dialogs.
 */
export const ADMIN_DIALOG_KEYS = {
  // Add your dialog keys here
  // Example:
  // CREATE_USER: "admin:create-user",
  // EDIT_USER: "admin:edit-user",
  // MANAGE_PERMISSIONS: "admin:manage-permissions",
  // BULK_OPERATIONS: "admin:bulk-operations",
} as const;

/**
 * Type representing all admin app dialog keys.
 * This provides type safety when using dialog keys.
 */
export type AdminDialogKey = (typeof ADMIN_DIALOG_KEYS)[keyof typeof ADMIN_DIALOG_KEYS];

/**
 * Combined dialog keys (common + app-specific).
 * This includes both common dialogs and app-specific dialogs.
 */
import { COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";

export const ALL_DIALOG_KEYS = {
  ...COMMON_DIALOG_KEYS,
  ...ADMIN_DIALOG_KEYS,
} as const;

/**
 * Type representing all available dialog keys (common + app-specific).
 */
export type AllDialogKey = (typeof ALL_DIALOG_KEYS)[keyof typeof ALL_DIALOG_KEYS];
