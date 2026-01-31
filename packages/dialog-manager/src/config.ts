/**
 * The delay in milliseconds after which a dialog is automatically cleaned up.
 */
export const DIALOG_AUTO_CLEANUP_DELAY_MS = 1000;

/**
 * URL parameter keys for dialog functionality.
 */
export const DIALOG_URL_PARAMS = {
  DIALOG: "dialog",
  DIALOG_PROPS: "dialogProps",
} as const;

/**
 * Common dialog keys that are available by default in the package.
 * Apps can extend these with their own keys.
 */
export const COMMON_DIALOG_KEYS = {
  CONFIRMATION: "confirmation",
  ALERT: "alert",
  EMAIL_PROVIDER: "email-provider",
  EMAIL_TEMPLATE: "email-template",
  EMAIL_TEMPLATE_DESIGN_EDITOR: "email-template-design-editor",
  EMAIL_TEMPLATE_EDITOR_SHEET: "email-template-editor-sheet",
  TEST_EMAIL: "test-email",
} as const;

/**
 * Type representing common dialog keys.
 */
export type CommonDialogKey = (typeof COMMON_DIALOG_KEYS)[keyof typeof COMMON_DIALOG_KEYS];

/**
 * Array of dialog keys that are blocked from opening via URL search parameters.
 * These dialogs should only be opened programmatically for security and UX reasons.
 */
export const DIALOG_URL_BLACKLIST: readonly CommonDialogKey[] = [
  COMMON_DIALOG_KEYS.CONFIRMATION,
  COMMON_DIALOG_KEYS.ALERT,
  COMMON_DIALOG_KEYS.EMAIL_PROVIDER,
  COMMON_DIALOG_KEYS.EMAIL_TEMPLATE,
  COMMON_DIALOG_KEYS.EMAIL_TEMPLATE_DESIGN_EDITOR,
  COMMON_DIALOG_KEYS.EMAIL_TEMPLATE_EDITOR_SHEET,
  COMMON_DIALOG_KEYS.TEST_EMAIL,
] as const;
