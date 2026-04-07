/**
 * Admin App Dialog Setup
 *
 * This file registers all dialogs for the admin app.
 * Dialogs are registered here and initialized in the app's root layout.
 *
 * To add a new dialog:
 * 1. Create your dialog component in src/dialogs/components/
 * 2. Import it here
 * 3. Add it to the dialogs object (eager load) or use registerLazy (lazy load)
 */

import { setupAppDialogs } from "@buildbase/dialog-manager/app-setup";
import type { DialogComponentMap } from "@buildbase/dialog-manager";

// Blog Dialogs
import { BlogPostDialog } from "./components/BlogPostDialog";
import { BlogFolderDialog } from "./components/BlogFolderDialog";
import { BlogTagDialog } from "./components/BlogTagDialog";
import { BlogAuthorDialog } from "./components/BlogAuthorDialog";
// Doc Dialogs
import { DocPostDialog } from "./components/DocPostDialog";
import { DocFolderDialog } from "./components/DocFolderDialog";
// Changelog Dialogs
import { ChangelogPostDialog } from "./components/ChangelogPostDialog";
import { ADMIN_DIALOG_KEYS } from "./constants";

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

// Email Dialogs
import { initializeEmailDialogs } from "@buildbase/components/email";

/**
 * Define your app's dialog component map type.
 * Use ADMIN_DIALOG_KEYS constants for the keys to ensure consistency.
 *
 * @example
 * ```ts
 * export type AdminAppDialogs = {
 *   [ADMIN_DIALOG_KEYS.CREATE_USER]: typeof CreateUserDialog;
 *   [ADMIN_DIALOG_KEYS.EDIT_USER]: typeof EditUserDialog;
 * } & DialogComponentMap;
 * ```
 */
export type AdminAppDialogs = {
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
  // Blog dialogs
  [ADMIN_DIALOG_KEYS.CREATE_BLOG_POST]: typeof BlogPostDialog;
  [ADMIN_DIALOG_KEYS.EDIT_BLOG_POST]: typeof BlogPostDialog;
  [ADMIN_DIALOG_KEYS.CREATE_BLOG_FOLDER]: typeof BlogFolderDialog;
  [ADMIN_DIALOG_KEYS.EDIT_BLOG_FOLDER]: typeof BlogFolderDialog;
  [ADMIN_DIALOG_KEYS.CREATE_BLOG_TAG]: typeof BlogTagDialog;
  [ADMIN_DIALOG_KEYS.EDIT_BLOG_TAG]: typeof BlogTagDialog;
  [ADMIN_DIALOG_KEYS.CREATE_BLOG_AUTHOR]: typeof BlogAuthorDialog;
  [ADMIN_DIALOG_KEYS.EDIT_BLOG_AUTHOR]: typeof BlogAuthorDialog;
  // Doc dialogs
  [ADMIN_DIALOG_KEYS.CREATE_DOC_POST]: typeof DocPostDialog;
  [ADMIN_DIALOG_KEYS.EDIT_DOC_POST]: typeof DocPostDialog;
  [ADMIN_DIALOG_KEYS.CREATE_DOC_FOLDER]: typeof DocFolderDialog;
  [ADMIN_DIALOG_KEYS.EDIT_DOC_FOLDER]: typeof DocFolderDialog;
  // Changelog dialogs
  [ADMIN_DIALOG_KEYS.CREATE_CHANGELOG_POST]: typeof ChangelogPostDialog;
  [ADMIN_DIALOG_KEYS.EDIT_CHANGELOG_POST]: typeof ChangelogPostDialog;
} & DialogComponentMap;

/**
 * Setup dialogs for the admin app
 * This function should be called once when the app initializes
 */
/**
 * Setup dialogs for the admin app
 * This function should be called once when the app initializes
 */
export function setupAdminDialogs() {
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
    // Blog dialogs
    [ADMIN_DIALOG_KEYS.CREATE_BLOG_POST]: BlogPostDialog,
    [ADMIN_DIALOG_KEYS.EDIT_BLOG_POST]: BlogPostDialog,
    [ADMIN_DIALOG_KEYS.CREATE_BLOG_FOLDER]: BlogFolderDialog,
    [ADMIN_DIALOG_KEYS.EDIT_BLOG_FOLDER]: BlogFolderDialog,
    [ADMIN_DIALOG_KEYS.CREATE_BLOG_TAG]: BlogTagDialog,
    [ADMIN_DIALOG_KEYS.EDIT_BLOG_TAG]: BlogTagDialog,
    [ADMIN_DIALOG_KEYS.CREATE_BLOG_AUTHOR]: BlogAuthorDialog,
    [ADMIN_DIALOG_KEYS.EDIT_BLOG_AUTHOR]: BlogAuthorDialog,
    // Doc dialogs
    [ADMIN_DIALOG_KEYS.CREATE_DOC_POST]: DocPostDialog,
    [ADMIN_DIALOG_KEYS.EDIT_DOC_POST]: DocPostDialog,
    [ADMIN_DIALOG_KEYS.CREATE_DOC_FOLDER]: DocFolderDialog,
    [ADMIN_DIALOG_KEYS.EDIT_DOC_FOLDER]: DocFolderDialog,
    // Changelog dialogs
    [ADMIN_DIALOG_KEYS.CREATE_CHANGELOG_POST]: ChangelogPostDialog,
    [ADMIN_DIALOG_KEYS.EDIT_CHANGELOG_POST]: ChangelogPostDialog,
  } as unknown as DialogComponentMap;

  setupAppDialogs<AdminAppDialogs>({
    dialogs,
    initializeCommon: true, // Initialize confirmation & alert dialogs
  });

  // Initialize email dialogs (EmailProviderDialog, EmailTemplateDialog, etc.)
  initializeEmailDialogs();
}

// Re-export dialog keys for convenience
export { MEDIA_LIBRARY_DIALOG_KEYS };
