/**
 * Initialize the dialog manager with common dialogs.
 * This should be called once when the app starts.
 */
import { dialogRegistry } from "./registry";
import { COMMON_DIALOG_KEYS } from "./config";
import { ConfirmationDialog } from "./common/confirmation-dialog";
import { AlertDialog } from "./common/alert-dialog";
import { EmailProviderDialog } from "./common/email-provider-dialog";
import { EmailTemplateDialog } from "./common/email-template-dialog";
import { EmailTemplateDesignEditorDialog } from "./common/email-template-design-editor-dialog";
import { EmailTemplateEditorSheet } from "./common/email-template-editor-sheet";
import { TestEmailDialog } from "./common/test-email-dialog";
import type { DialogOrSheetComponent } from "./base-props";

/**
 * Initialize common dialogs in the registry.
 * Apps can call this to register the default confirmation, alert, and email dialogs.
 * Safe to call multiple times - will only register if not already registered.
 */
export function initializeCommonDialogs() {
  dialogRegistry.register(COMMON_DIALOG_KEYS.CONFIRMATION, ConfirmationDialog, { override: true });
  dialogRegistry.register(COMMON_DIALOG_KEYS.ALERT, AlertDialog, { override: true });
  // Email dialogs have custom required props, so we cast them to the base type
  dialogRegistry.register(COMMON_DIALOG_KEYS.EMAIL_PROVIDER, EmailProviderDialog as DialogOrSheetComponent, {
    override: true,
  });
  dialogRegistry.register(COMMON_DIALOG_KEYS.EMAIL_TEMPLATE, EmailTemplateDialog as DialogOrSheetComponent, {
    override: true,
  });
  dialogRegistry.register(
    COMMON_DIALOG_KEYS.EMAIL_TEMPLATE_DESIGN_EDITOR,
    EmailTemplateDesignEditorDialog as DialogOrSheetComponent,
    {
      override: true,
    }
  );
  dialogRegistry.register(
    COMMON_DIALOG_KEYS.EMAIL_TEMPLATE_EDITOR_SHEET,
    EmailTemplateEditorSheet as DialogOrSheetComponent,
    {
      override: true,
    }
  );
  dialogRegistry.register(COMMON_DIALOG_KEYS.TEST_EMAIL, TestEmailDialog as DialogOrSheetComponent, {
    override: true,
  });
}
