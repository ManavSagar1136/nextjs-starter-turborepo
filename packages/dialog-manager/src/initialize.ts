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
 */
export function initializeCommonDialogs() {
  dialogRegistry.register(COMMON_DIALOG_KEYS.CONFIRMATION, ConfirmationDialog);
  dialogRegistry.register(COMMON_DIALOG_KEYS.ALERT, AlertDialog);
}
