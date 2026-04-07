/**
 * Admin App Dialogs - Main Export
 *
 * This file exports all dialog-related functionality for the admin app,
 * including constants, setup function, and types.
 */

// Export constants for dialog keys
export { ADMIN_DIALOG_KEYS, ALL_DIALOG_KEYS } from "./constants";
export type { AdminDialogKey, AllDialogKey } from "./constants";

// Export setup function
export { setupAdminDialogs } from "./setup";

// Export dialog component types
export type { AdminAppDialogs } from "./setup";

// Re-export common dialog keys and types from dialog-manager for convenience
export { COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";
export type { CommonDialogKey } from "@buildbase/dialog-manager";

// Typed props helper for admin-specific dialogs
import type { AdminAppDialogs } from "./setup";
export type AdminDialogProps<K extends keyof AdminAppDialogs> = Omit<
  React.ComponentProps<AdminAppDialogs[K]>,
  "open" | "onOpenChange"
>;

// Typed dialog manager hook for admin app (includes both common + admin dialog types)
export { useAdminDialogManager } from "./hooks";
