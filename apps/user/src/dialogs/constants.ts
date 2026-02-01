/**
 * Dialog Keys Constants
 *
 * This file contains all dialog keys for the user app.
 * Use these constants instead of hardcoding strings to ensure type safety.
 */

import { COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";
import { MEDIA_LIBRARY_DIALOG_KEYS } from "@buildbase/dialog-manager/media-library";

/**
 * User app specific dialog keys.
 */
export const USER_DIALOG_KEYS = {
  // Add app-specific dialog keys here as needed
} as const;

/**
 * Type representing all user app dialog keys.
 */
export type UserDialogKey = (typeof USER_DIALOG_KEYS)[keyof typeof USER_DIALOG_KEYS];

/**
 * Combined dialog keys (common + media-library + app-specific).
 */
export const ALL_DIALOG_KEYS = {
  ...COMMON_DIALOG_KEYS,
  ...MEDIA_LIBRARY_DIALOG_KEYS,
  ...USER_DIALOG_KEYS,
} as const;

/**
 * Type representing all available dialog keys.
 */
export type AllDialogKey = (typeof ALL_DIALOG_KEYS)[keyof typeof ALL_DIALOG_KEYS];

// Re-export for convenience
export { COMMON_DIALOG_KEYS, MEDIA_LIBRARY_DIALOG_KEYS };
