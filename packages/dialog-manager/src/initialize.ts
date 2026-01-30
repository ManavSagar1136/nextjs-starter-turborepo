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
 * Safe to call multiple times - will only register if not already registered.
 */
export function initializeCommonDialogs() {
  dialogRegistry.register(COMMON_DIALOG_KEYS.CONFIRMATION, ConfirmationDialog, { override: true });
  dialogRegistry.register(COMMON_DIALOG_KEYS.ALERT, AlertDialog, { override: true });
}
