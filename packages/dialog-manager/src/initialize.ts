/**
 * Initialize the dialog manager with common dialogs.
 * This should be called once when the app starts.
 */
import { dialogRegistry } from "./registry";
import { COMMON_DIALOG_KEYS } from "./config";
import { ConfirmationDialog } from "./common/confirmation-dialog";
import { AlertDialog } from "./common/alert-dialog";
import { TestEmailDialog } from "./common/test-email-dialog";
import type { DialogOrSheetComponent } from "./base-props";

/**
 * Initialize common dialogs in the registry.
 * Apps can call this to register the default confirmation, alert, and test email dialogs.
 * Safe to call multiple times - will only register if not already registered.
 * 
 * NOTE: Email dialogs (EmailTemplateDialog, EmailProviderDialog, etc.) have been moved 
 * to @buildbase/components/email to break cyclic dependencies. If you need those dialogs,
 * import and register them from "@buildbase/components/email" in your app:
 * 
 * ```ts
 * import { 
 *   EmailTemplateDialog, 
 *   EmailProviderDialog,
 *   EmailTemplateDesignEditorDialog,
 *   EmailTemplateEditorSheet
 * } from "@buildbase/components/email";
 * import { dialogRegistry, COMMON_DIALOG_KEYS } from "@buildbase/dialog-manager";
 * 
 * dialogRegistry.register(COMMON_DIALOG_KEYS.EMAIL_TEMPLATE, EmailTemplateDialog);
 * dialogRegistry.register(COMMON_DIALOG_KEYS.EMAIL_PROVIDER, EmailProviderDialog);
 * dialogRegistry.register(COMMON_DIALOG_KEYS.EMAIL_TEMPLATE_DESIGN_EDITOR, EmailTemplateDesignEditorDialog);
 * dialogRegistry.register(COMMON_DIALOG_KEYS.EMAIL_TEMPLATE_EDITOR_SHEET, EmailTemplateEditorSheet);
 * ```
 */
export function initializeCommonDialogs() {
  dialogRegistry.register(COMMON_DIALOG_KEYS.CONFIRMATION, ConfirmationDialog, { override: true });
  dialogRegistry.register(COMMON_DIALOG_KEYS.ALERT, AlertDialog, { override: true });
  dialogRegistry.register(COMMON_DIALOG_KEYS.TEST_EMAIL, TestEmailDialog as DialogOrSheetComponent, {
    override: true,
  });
}
