/**
 * User App Dialog Setup
 *
 * This file registers all dialogs for the user app.
 * Dialogs are registered here and initialized in the app's root layout.
 */

import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
import type { DialogComponentMap } from "@buildbase/dialog-manager";

// Media Library Dialogs
import {
  CreateFolderDialog,
  EditFolderDialog,
  MoveFolderDialog,
  CreateTagDialog,
  EditTagDialog,
  AssignTagsDialog,
  MoveAssetDialog,
  MediaUploadDialog,
  AssetPreviewDialog,
  MEDIA_LIBRARY_DIALOG_KEYS,
} from "@buildbase/dialog-manager/media-library";

// API Key Dialogs
import { CreateApiKeyDialog } from "./api-keys/CreateApiKeyDialog";
import { RevealApiKeyDialog } from "./api-keys/RevealApiKeyDialog";

export const API_KEY_DIALOG_KEYS = {
  CREATE: "api-key:create",
  REVEAL: "api-key:reveal",
} as const;

export type UserAppDialogs = {
  // Media library dialogs
  [MEDIA_LIBRARY_DIALOG_KEYS.CREATE_FOLDER]: typeof CreateFolderDialog;
  [MEDIA_LIBRARY_DIALOG_KEYS.EDIT_FOLDER]: typeof EditFolderDialog;
  [MEDIA_LIBRARY_DIALOG_KEYS.MOVE_FOLDER]: typeof MoveFolderDialog;
  [MEDIA_LIBRARY_DIALOG_KEYS.CREATE_TAG]: typeof CreateTagDialog;
  [MEDIA_LIBRARY_DIALOG_KEYS.EDIT_TAG]: typeof EditTagDialog;
  [MEDIA_LIBRARY_DIALOG_KEYS.ASSIGN_TAGS]: typeof AssignTagsDialog;
  [MEDIA_LIBRARY_DIALOG_KEYS.MOVE_ASSET]: typeof MoveAssetDialog;
  [MEDIA_LIBRARY_DIALOG_KEYS.MEDIA_UPLOAD]: typeof MediaUploadDialog;
  [MEDIA_LIBRARY_DIALOG_KEYS.ASSET_PREVIEW]: typeof AssetPreviewDialog;
  // API Key dialogs
  [API_KEY_DIALOG_KEYS.CREATE]: typeof CreateApiKeyDialog;
  [API_KEY_DIALOG_KEYS.REVEAL]: typeof RevealApiKeyDialog;
} & DialogComponentMap;

/**
 * Setup dialogs for the user app
 * This function should be called once when the app initializes
 */
export function setupUserDialogs() {
  // Type assertion needed because dialog props have required callbacks
  // that are provided when openDialog is called, not at registration time
  const dialogs = {
    // Media Library dialogs
    [MEDIA_LIBRARY_DIALOG_KEYS.CREATE_FOLDER]: CreateFolderDialog,
    [MEDIA_LIBRARY_DIALOG_KEYS.EDIT_FOLDER]: EditFolderDialog,
    [MEDIA_LIBRARY_DIALOG_KEYS.MOVE_FOLDER]: MoveFolderDialog,
    [MEDIA_LIBRARY_DIALOG_KEYS.CREATE_TAG]: CreateTagDialog,
    [MEDIA_LIBRARY_DIALOG_KEYS.EDIT_TAG]: EditTagDialog,
    [MEDIA_LIBRARY_DIALOG_KEYS.ASSIGN_TAGS]: AssignTagsDialog,
    [MEDIA_LIBRARY_DIALOG_KEYS.MOVE_ASSET]: MoveAssetDialog,
    [MEDIA_LIBRARY_DIALOG_KEYS.MEDIA_UPLOAD]: MediaUploadDialog,
    [MEDIA_LIBRARY_DIALOG_KEYS.ASSET_PREVIEW]: AssetPreviewDialog,

    // API Key dialogs
    [API_KEY_DIALOG_KEYS.CREATE]: CreateApiKeyDialog,
    [API_KEY_DIALOG_KEYS.REVEAL]: RevealApiKeyDialog,
  } as unknown as DialogComponentMap;

  setupAppDialogs({
    dialogs,
    initializeCommon: true, // Initialize confirmation & alert dialogs
  });
}

// Re-export dialog keys for convenience
export { MEDIA_LIBRARY_DIALOG_KEYS };
