/**
 * Initialize the dialog manager with common dialogs.
 * This should be called once when the app starts.
 */
import { dialogRegistry } from "./registry";
import { COMMON_DIALOG_KEYS } from "./config";
import { ConfirmationDialog } from "./common/confirmation-dialog";
import { AlertDialog } from "./common/alert-dialog";

/**
 * Initialize common dialogs in the registry.
 * Apps can call this to register the default confirmation and alert dialogs.
 *
 * This function is idempotent - calling it multiple times is safe.
 * (Required for React Strict Mode which runs effects twice)
 */
export function initializeCommonDialogs() {
  // Use override: true to make this idempotent (safe to call multiple times)
  // This is needed because React Strict Mode runs useEffect twice
  if (!dialogRegistry.has(COMMON_DIALOG_KEYS.CONFIRMATION)) {
    dialogRegistry.register(COMMON_DIALOG_KEYS.CONFIRMATION, ConfirmationDialog);
  }
  if (!dialogRegistry.has(COMMON_DIALOG_KEYS.ALERT)) {
    dialogRegistry.register(COMMON_DIALOG_KEYS.ALERT, AlertDialog);
  }
}
