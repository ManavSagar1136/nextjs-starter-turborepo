// Config
export { DIALOG_AUTO_CLEANUP_DELAY_MS, DIALOG_URL_PARAMS, COMMON_DIALOG_KEYS, DIALOG_URL_BLACKLIST } from "./config";
export type { CommonDialogKey } from "./config";
import { DIALOG_URL_PARAMS } from "./config";

// Base Props (for dialogs and sheets)
export type { DialogOrSheetBaseProps, DialogOrSheetComponent, DialogOrSheetCustomProps } from "./base-props";

// Types
export type {
  DialogComponentMap,
  CommonDialogComponentMap,
  CommonDialogProps,
  DialogPropsMap,
  DialogKey,
  DialogInstance,
  DialogContextType,
  DialogRegistryOptions,
  DialogOpenOptions,
} from "./types";

// Context
export { DialogContext, DEFAULT_CONTEXT_VALUE } from "./context";

// Hooks
export { useDialogManager } from "./hooks";

// Provider
export { DialogProvider } from "./provider";
export type { DialogProviderProps } from "./provider";

// Registry
export { dialogRegistry, DialogRegistryController, createDialogRegistry } from "./registry";

// Common Dialogs
export {
  ConfirmationDialog,
  CONFIRMATION_DIALOG_VARIANTS,
  AlertDialog,
  ALERT_DIALOG_VARIANTS,
  TestEmailDialog,
} from "./common";
export type {
  ConfirmationDialogProps,
  ConfirmationDialogVariant,
  AlertDialogProps,
  AlertDialogVariant,
  TestEmailDialogProps,
} from "./common";

// NOTE: Email dialogs (EmailTemplateDialog, EmailTemplateDesignEditorDialog,
// EmailTemplateEditorSheet, EmailProviderDialog) have been moved to @buildbase/components/email
// to break the cyclic dependency. Import them from "@buildbase/components/email" instead.

// Initialize
export { initializeCommonDialogs } from "./initialize";

// App Setup
export { setupAppDialogs, createLazyDialogLoader } from "./app-setup";
export type { AppDialogSetupOptions } from "./app-setup";

// Media Library Dialogs
export { MEDIA_LIBRARY_DIALOG_KEYS, type MediaLibraryDialogKey } from "./media-library";
export {
  CreateFolderDialog,
  EditFolderDialog,
  MoveFolderDialog,
  CreateTagDialog,
  EditTagDialog,
  AssignTagsDialog,
  MoveAssetDialog,
  MediaUploadDialog,
  AssetPreviewDialog,
  FolderTreeSelect,
} from "./media-library";
export type {
  AssetPreviewDialogProps,
  MediaUploadDialogProps,
  CreateFolderDialogProps,
  EditFolderDialogProps,
  MoveFolderDialogProps,
  CreateTagDialogProps,
  EditTagDialogProps,
  AssignTagsDialogProps,
  MoveAssetDialogProps,
  UploadedFile,
} from "./media-library";

/**
 * Builds a URL for opening a dialog with optional props.
 *
 * @param rootPath - The base path (e.g., "/dashboard", "/admin")
 * @param dialogKey - The dialog key to open
 * @param props - Optional props to pass to the dialog
 * @returns The constructed URL string
 */
export function buildDialogUrl(rootPath: string, dialogKey: string, props?: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  // Add dialog key
  searchParams.set(DIALOG_URL_PARAMS.DIALOG, dialogKey);

  // Add props if provided
  if (props && Object.keys(props).length > 0) {
    searchParams.set(DIALOG_URL_PARAMS.DIALOG_PROPS, JSON.stringify(props));
  }

  // Construct the full URL
  const queryString = searchParams.toString();
  return `${rootPath}${queryString ? `?${queryString}` : ""}`;
}
