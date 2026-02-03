/**
 * Initialize email dialogs in the dialog registry.
 * Call this after initializeCommonDialogs() to register email-related dialogs.
 */
import { dialogRegistry, COMMON_DIALOG_KEYS, type DialogOrSheetComponent } from "@buildbase/dialog-manager";
import { EmailProviderDialog } from "./email-provider-dialog";
import { EmailTemplateDialog } from "./email-template-dialog";
import { EmailTemplateDesignEditorDialog } from "./email-template-design-editor-dialog";
import { EmailTemplateEditorSheet } from "./email-template-editor-sheet";

/**
 * Initialize email dialogs in the registry.
 * This should be called after initializeCommonDialogs() if you need email functionality.
 * Safe to call multiple times - will only register if not already registered.
 *
 * @example
 * ```ts
 * import { initializeCommonDialogs } from "@buildbase/dialog-manager";
 * import { initializeEmailDialogs } from "@buildbase/components/email";
 *
 * initializeCommonDialogs();
 * initializeEmailDialogs();
 * ```
 */
export function initializeEmailDialogs() {
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
}
