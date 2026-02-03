// Email Components
export { EmailTemplateForm, type EmailTemplateFormProps, type EmailTemplateFormData } from "./email-template-form";
// Re-export EmailTemplateType from database package
export { EmailTemplateType, EMAIL_TEMPLATE_TYPES } from "@buildbase/database";
export { EmailProviderForm, type EmailProviderFormProps, type EmailProviderFormData } from "./email-provider-form";
export { UnlayerEditor, type UnlayerEditorProps } from "./unlayer-editor";

// Email Dialogs (moved from @buildbase/dialog-manager to break cyclic dependency)
export {
  EmailTemplateDialog,
  EmailTemplateDesignEditorDialog,
  EmailTemplateEditorSheet,
  EmailProviderDialog,
  initializeEmailDialogs,
} from "./dialogs";
export type {
  EmailTemplateDialogProps,
  EmailTemplateDesignEditorDialogProps,
  EmailTemplateEditorSheetProps,
  EmailProviderDialogProps,
} from "./dialogs";
