/**
 * User App Dialogs - Main Export
 *
 * This file exports all dialog-related functionality for the user app,
 * including constants, setup function, and types.
 */

// Export constants for dialog keys
export { USER_DIALOG_KEYS, ALL_DIALOG_KEYS } from "./constants";
export type { UserDialogKey, AllDialogKey } from "./constants";

// Export setup function
export { setupUserDialogs } from "./setup";

// Export dialog component types
export type { UserAppDialogs } from "./setup";

// Re-export common dialog keys and types from dialog-manager for convenience
export { COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";
export type { CommonDialogKey } from "@buildbase/dialog-manager";
