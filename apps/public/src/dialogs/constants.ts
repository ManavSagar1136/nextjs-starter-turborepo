/**
 * Dialog Keys Constants
 * 
 * This file contains all dialog keys for the public app.
 * Use these constants instead of hardcoding strings to ensure type safety
 * and avoid typos. All dialog keys should be defined here.
 * 
 * Naming convention: Use the format "app:feature" (e.g., "public:contact")
 */

/**
 * Public app dialog keys.
 * Add new dialog keys here as you create new dialogs.
 */
export const PUBLIC_DIALOG_KEYS = {
  // Add your dialog keys here
  // Example:
  // CONTACT: "public:contact",
  // NEWSLETTER: "public:newsletter",
  // INPUT: "public:input",
} as const;

/**
 * Type representing all public app dialog keys.
 * This provides type safety when using dialog keys.
 */
export type PublicDialogKey = (typeof PUBLIC_DIALOG_KEYS)[keyof typeof PUBLIC_DIALOG_KEYS];

/**
 * Combined dialog keys (common + app-specific).
 * This includes both common dialogs and app-specific dialogs.
 */
import { COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";

export const ALL_DIALOG_KEYS = {
  ...COMMON_DIALOG_KEYS,
  ...PUBLIC_DIALOG_KEYS,
} as const;

/**
 * Type representing all available dialog keys (common + app-specific).
 */
export type AllDialogKey = (typeof ALL_DIALOG_KEYS)[keyof typeof ALL_DIALOG_KEYS];
