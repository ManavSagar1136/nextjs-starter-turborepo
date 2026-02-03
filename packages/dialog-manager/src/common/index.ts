export { ConfirmationDialog, CONFIRMATION_DIALOG_VARIANTS } from "./confirmation-dialog";
export type { ConfirmationDialogProps, ConfirmationDialogVariant } from "./confirmation-dialog";

export { AlertDialog, ALERT_DIALOG_VARIANTS } from "./alert-dialog";
export type { AlertDialogProps, AlertDialogVariant } from "./alert-dialog";

export { TestEmailDialog } from "./test-email-dialog";
export type { TestEmailDialogProps } from "./test-email-dialog";

// NOTE: Email dialogs (EmailTemplateDialog, EmailTemplateDesignEditorDialog,
// EmailTemplateEditorSheet, EmailProviderDialog) have been moved to @buildbase/components/email
// to break the cyclic dependency between @buildbase/dialog-manager and @buildbase/components.
